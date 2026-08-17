import "server-only";

import { and, asc, eq, isNotNull, lte } from "drizzle-orm";

import { checkoutPagamentosTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { obterStripe } from "../gateways/stripe/cliente-stripe";
import { sincronizarPagamentoCheckoutStripe } from "../gateways/stripe/webhook-stripe";
import { expirarPagamentoPendente } from "./expirar-pagamento-pendente";
import {
  classificarSessaoStripeParaReconciliacao,
  pixPodeExpirar,
} from "./politica-reconciliacao-pagamento";

const LIMITE_POR_EXECUCAO = 50;

async function reconciliarPix(agora: Date) {
  const pagamentos = await dbTransacional
    .select({
      id: checkoutPagamentosTable.id,
      pedidoId: checkoutPagamentosTable.pedidoId,
      expiresAt: checkoutPagamentosTable.expiresAt,
    })
    .from(checkoutPagamentosTable)
    .where(
      and(
        eq(checkoutPagamentosTable.gateway, "efibank"),
        eq(checkoutPagamentosTable.status, "pending"),
        isNotNull(checkoutPagamentosTable.expiresAt),
        lte(checkoutPagamentosTable.expiresAt, agora),
      ),
    )
    .orderBy(asc(checkoutPagamentosTable.expiresAt))
    .limit(LIMITE_POR_EXECUCAO);

  let expirados = 0;
  for (const pagamento of pagamentos) {
    if (
      !pixPodeExpirar({
        status: "pending",
        expiraEm: pagamento.expiresAt,
        agora,
      })
    ) {
      continue;
    }

    const resultado = await dbTransacional.transaction((tx) =>
      expirarPagamentoPendente({
        tx,
        pedidoId: pagamento.pedidoId,
        pagamentoId: pagamento.id,
        gateway: "efibank",
        referencia: `reconciliacao:pix:${pagamento.id}`,
      }),
    );
    if (resultado.expiradoAgora) expirados += 1;
  }

  return { consultados: pagamentos.length, expirados };
}

async function reconciliarStripe() {
  const pagamentos = await dbTransacional
    .select({
      id: checkoutPagamentosTable.id,
      pedidoId: checkoutPagamentosTable.pedidoId,
      sessionId: checkoutPagamentosTable.transactionId,
    })
    .from(checkoutPagamentosTable)
    .where(
      and(
        eq(checkoutPagamentosTable.gateway, "stripe"),
        eq(checkoutPagamentosTable.status, "pending"),
        isNotNull(checkoutPagamentosTable.transactionId),
      ),
    )
    .orderBy(asc(checkoutPagamentosTable.createdAt))
    .limit(LIMITE_POR_EXECUCAO);

  const stripe = obterStripe();
  let expirados = 0;
  let confirmados = 0;
  const erros: Array<{ pagamentoId: string; mensagem: string }> = [];

  for (const pagamento of pagamentos) {
    if (!pagamento.sessionId?.startsWith("cs_")) continue;

    try {
      const session = await stripe.checkout.sessions.retrieve(
        pagamento.sessionId,
      );
      const decisao = classificarSessaoStripeParaReconciliacao({
        status: session.status,
        pagamentoStatus: session.payment_status,
      });

      if (decisao === "confirmar") {
        await sincronizarPagamentoCheckoutStripe({
          sessionId: pagamento.sessionId,
        });
        confirmados += 1;
      } else if (decisao === "expirar") {
        const resultado = await dbTransacional.transaction((tx) =>
          expirarPagamentoPendente({
            tx,
            pedidoId: pagamento.pedidoId,
            pagamentoId: pagamento.id,
            gateway: "stripe",
            referencia: `reconciliacao:stripe:${session.id}`,
          }),
        );
        if (resultado.expiradoAgora) expirados += 1;
      }
    } catch (erro) {
      erros.push({
        pagamentoId: pagamento.id,
        mensagem:
          erro instanceof Error
            ? erro.message
            : "Falha desconhecida no Stripe.",
      });
    }
  }

  return { consultados: pagamentos.length, confirmados, expirados, erros };
}

export async function reconciliarPagamentosPendentes() {
  const agora = new Date();
  const [pix, stripe] = await Promise.all([
    reconciliarPix(agora),
    reconciliarStripe(),
  ]);

  return { executadoEm: agora.toISOString(), pix, stripe };
}
