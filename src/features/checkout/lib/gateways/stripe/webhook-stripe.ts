import { and, eq, ne } from "drizzle-orm";
import type Stripe from "stripe";

import {
  checkoutPagamentosTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { montarDescricaoPagamentoAprovado } from "../../admin-pedidos/montar-descricao-historico-pedido";
import { enviarEmailPagamentoStripeAprovado } from "../../emails/email-service";
import { buscarPedidoEmailPorId } from "../../../queries/pedido/buscar-pedido-email";
import { obterStripe, obterWebhookSecretStripe } from "./cliente-stripe";

type ConfirmarPagamentoStripeParams = {
  pedidoId: string;
  pagamentoId: string;
  transactionId: string;
  providerResponse: unknown;
};

function obterMetadataPagamentoStripe(event: Stripe.Event) {
  const objeto = event.data.object;

  if (event.type === "checkout.session.completed" && "metadata" in objeto) {
    const session = objeto as Stripe.Checkout.Session;

    return {
      pedidoId: session.metadata?.pedidoId,
      pagamentoId: session.metadata?.pagamentoId,
      transactionId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.id,
      pago: session.payment_status === "paid",
    };
  }

  if (event.type === "payment_intent.succeeded" && "metadata" in objeto) {
    const paymentIntent = objeto as Stripe.PaymentIntent;

    return {
      pedidoId: paymentIntent.metadata?.pedidoId,
      pagamentoId: paymentIntent.metadata?.pagamentoId,
      transactionId: paymentIntent.id,
      pago: true,
    };
  }

  return null;
}

async function confirmarPagamentoStripe({
  pedidoId,
  pagamentoId,
  transactionId,
  providerResponse,
}: ConfirmarPagamentoStripeParams) {
  return dbTransacional.transaction(async (tx) => {
    const pagamentosAtualizados = await tx
      .update(checkoutPagamentosTable)
      .set({
        status: "paid",
        transactionId,
        paidAt: new Date(),
        providerResponse,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(checkoutPagamentosTable.id, pagamentoId),
          ne(checkoutPagamentosTable.status, "paid"),
        ),
      )
      .returning({ id: checkoutPagamentosTable.id });

    const pedidosAtualizados = await tx
      .update(checkoutPedidosTable)
      .set({
        status: "paid",
        pagamentoStatus: "paid",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(checkoutPedidosTable.id, pedidoId),
          ne(checkoutPedidosTable.status, "paid"),
        ),
      )
      .returning({
        id: checkoutPedidosTable.id,
        numeroPedido: checkoutPedidosTable.numeroPedido,
        status: checkoutPedidosTable.status,
      });

    const pedidoAtualizado = pedidosAtualizados[0];

    if (pagamentosAtualizados.length > 0 && pedidoAtualizado) {
      await tx.insert(checkoutPedidoHistoricosTable).values({
        pedidoId,
        tipo: "pagamento_aprovado",
        descricao: montarDescricaoPagamentoAprovado(
          pedidoAtualizado.numeroPedido,
        ),
        origem: "system",
        statusNovo: pedidoAtualizado.status,
        metadata: {
          gateway: "stripe",
          transactionId,
        },
      });
    }

    return pagamentosAtualizados.length > 0;
  });
}

export function construirEventoWebhookStripe({
  body,
  signature,
}: {
  body: string;
  signature: string;
}) {
  const stripe = obterStripe();

  return stripe.webhooks.constructEvent(
    body,
    signature,
    obterWebhookSecretStripe(),
  );
}

export async function processarWebhookStripe(event: Stripe.Event) {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "payment_intent.succeeded"
  ) {
    return;
  }

  const metadata = obterMetadataPagamentoStripe(event);

  if (!metadata?.pedidoId || !metadata.pagamentoId) {
    console.error("Webhook Stripe sem metadata de pedido/pagamento.", {
      eventId: event.id,
      eventType: event.type,
    });
    return;
  }

  if (!metadata.pago) {
    return;
  }

  const pagamentoFoiConfirmado = await confirmarPagamentoStripe({
    pedidoId: metadata.pedidoId,
    pagamentoId: metadata.pagamentoId,
    transactionId: metadata.transactionId,
    providerResponse: {
      stripeWebhook: {
        eventId: event.id,
        eventType: event.type,
        object: event.data.object,
      },
    },
  });

  if (!pagamentoFoiConfirmado) {
    return;
  }

  const pedidoEmail = await buscarPedidoEmailPorId(metadata.pedidoId);

  if (!pedidoEmail) {
    console.error("Pedido nao encontrado para email Stripe aprovado.", {
      eventId: event.id,
      pedidoId: metadata.pedidoId,
    });
    return;
  }

  await enviarEmailPagamentoStripeAprovado(pedidoEmail);
}
