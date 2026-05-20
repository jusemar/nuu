import { and, eq, ne } from "drizzle-orm";

import {
  checkoutEfiWebhookEventosTable,
  checkoutPagamentosTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { montarDescricaoPagamentoAprovado } from "../../admin-pedidos/montar-descricao-historico-pedido";
import { enviarEmailPagamentoPixAprovado } from "../../emails/email-service";
import { resolverStatusOperacionalPedidoAposPagamento } from "../../pedidos/resolver-status-operacional-pedido";
import { buscarPedidoEmailPorId } from "../../../queries/pedido/buscar-pedido-email";

type PixRecebidoWebhookEfi = {
  endToEndId?: string;
  txid?: string;
  valor?: string;
  horario?: string;
  devolucoes?: unknown[];
  [key: string]: unknown;
};

type PayloadWebhookPixEfi = {
  pix?: PixRecebidoWebhookEfi[];
};

type ResultadoProcessamentoPixEfi = {
  status:
    | "ignorado"
    | "duplicado"
    | "pagamento_confirmado"
    | "pagamento_ja_confirmado"
    | "erro";
  identificadorEvento: string;
  txid?: string;
  pedidoId?: string;
  pagamentoId?: string;
};

function montarIdentificadorEventoPix(pix: PixRecebidoWebhookEfi) {
  return pix.endToEndId || pix.txid || null;
}

function pixRepresentaPagamentoConfirmado(pix: PixRecebidoWebhookEfi) {
  return Boolean(pix.txid && pix.endToEndId && !pix.devolucoes?.length);
}

export function validarTokenWebhookPixEfi({
  tokenRecebido,
}: {
  tokenRecebido: string | null;
}) {
  const tokenConfigurado = process.env.EFI_WEBHOOK_TOKEN?.trim();

  if (!tokenConfigurado) {
    return true;
  }

  return tokenRecebido === tokenConfigurado;
}

async function confirmarPagamentoPixEfi({
  pix,
  identificadorEvento,
}: {
  pix: PixRecebidoWebhookEfi;
  identificadorEvento: string;
}) {
  return dbTransacional.transaction(async (tx) => {
    const pagamentoAtual = await tx.query.checkoutPagamentosTable.findFirst({
      where: eq(checkoutPagamentosTable.pixTxid, pix.txid ?? ""),
    });

    const eventoInserido = await tx
      .insert(checkoutEfiWebhookEventosTable)
      .values({
        identificadorEvento,
        endToEndId: pix.endToEndId ?? null,
        txid: pix.txid ?? null,
        pedidoId: pagamentoAtual?.pedidoId ?? null,
        pagamentoId: pagamentoAtual?.id ?? null,
        statusProcessamento: "recebido",
        payload: pix,
      })
      .onConflictDoNothing({
        target: checkoutEfiWebhookEventosTable.identificadorEvento,
      })
      .returning({ id: checkoutEfiWebhookEventosTable.id });

    if (eventoInserido.length === 0) {
      return {
        confirmadoAgora: false,
        duplicado: true,
        pedidoId: pagamentoAtual?.pedidoId,
        pagamentoId: pagamentoAtual?.id,
      };
    }

    if (!pagamentoAtual) {
      await tx
        .update(checkoutEfiWebhookEventosTable)
        .set({
          statusProcessamento: "erro",
          erro: "Pagamento PIX nao encontrado pelo txid.",
          updatedAt: new Date(),
        })
        .where(
          eq(
            checkoutEfiWebhookEventosTable.identificadorEvento,
            identificadorEvento,
          ),
        );

      return {
        confirmadoAgora: false,
        duplicado: false,
        erro: "Pagamento PIX não encontrado pelo txid.",
      };
    }

    const pedidoAtual = await tx.query.checkoutPedidosTable.findFirst({
      where: eq(checkoutPedidosTable.id, pagamentoAtual.pedidoId),
    });

    if (!pedidoAtual) {
      throw new Error("Pedido do pagamento PIX não encontrado.");
    }

    if (
      pagamentoAtual.status === "paid" &&
      pedidoAtual.pagamentoStatus === "paid"
    ) {
      await tx
        .update(checkoutEfiWebhookEventosTable)
        .set({
          statusProcessamento: "ignorado_pagamento_ja_confirmado",
          updatedAt: new Date(),
        })
        .where(
          eq(
            checkoutEfiWebhookEventosTable.identificadorEvento,
            identificadorEvento,
          ),
        );

      return {
        confirmadoAgora: false,
        duplicado: false,
        pedidoId: pedidoAtual.id,
        pagamentoId: pagamentoAtual.id,
      };
    }

    const pagamentosAtualizados = await tx
      .update(checkoutPagamentosTable)
      .set({
        status: "paid",
        transactionId: pix.endToEndId ?? pagamentoAtual.transactionId,
        paidAt: pix.horario ? new Date(pix.horario) : new Date(),
        providerResponse: {
          efiWebhook: pix,
        },
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(checkoutPagamentosTable.id, pagamentoAtual.id),
          ne(checkoutPagamentosTable.status, "paid"),
        ),
      )
      .returning({ id: checkoutPagamentosTable.id });

    const pedidosAtualizados = await tx
      .update(checkoutPedidosTable)
      .set({
        status: resolverStatusOperacionalPedidoAposPagamento(
          pedidoAtual.status,
        ),
        pagamentoStatus: "paid",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(checkoutPedidosTable.id, pedidoAtual.id),
          ne(checkoutPedidosTable.pagamentoStatus, "paid"),
        ),
      )
      .returning({
        id: checkoutPedidosTable.id,
        numeroPedido: checkoutPedidosTable.numeroPedido,
        status: checkoutPedidosTable.status,
      });

    const houveConfirmacao =
      pagamentosAtualizados.length > 0 || pedidosAtualizados.length > 0;
    const pedidoAtualizado = pedidosAtualizados[0] ?? pedidoAtual;

    if (houveConfirmacao) {
      await tx.insert(checkoutPedidoHistoricosTable).values({
        pedidoId: pedidoAtual.id,
        tipo: "pagamento_aprovado",
        descricao: montarDescricaoPagamentoAprovado(
          pedidoAtualizado.numeroPedido,
        ),
        origem: "system",
        statusNovo: pedidoAtualizado.status,
        metadata: {
          gateway: "efibank",
          txid: pix.txid,
          endToEndId: pix.endToEndId,
          valor: pix.valor,
          horario: pix.horario,
        },
      });
    }

    await tx
      .update(checkoutEfiWebhookEventosTable)
      .set({
        statusProcessamento: houveConfirmacao
          ? "processado"
          : "ignorado_sem_alteracao",
        pedidoId: pedidoAtual.id,
        pagamentoId: pagamentoAtual.id,
        updatedAt: new Date(),
      })
      .where(
        eq(
          checkoutEfiWebhookEventosTable.identificadorEvento,
          identificadorEvento,
        ),
      );

    return {
      confirmadoAgora: houveConfirmacao,
      duplicado: false,
      pedidoId: pedidoAtual.id,
      pagamentoId: pagamentoAtual.id,
    };
  });
}

export async function processarWebhookPixEfi(
  payload: PayloadWebhookPixEfi,
): Promise<ResultadoProcessamentoPixEfi[]> {
  const pixRecebidos = payload.pix ?? [];

  console.info("Webhook PIX Efí recebido.", {
    quantidadePix: pixRecebidos.length,
  });

  if (pixRecebidos.length === 0) {
    return [
      {
        status: "ignorado",
        identificadorEvento: "sem_pix",
      },
    ];
  }

  const resultados: ResultadoProcessamentoPixEfi[] = [];

  for (const pix of pixRecebidos) {
    const identificadorEvento = montarIdentificadorEventoPix(pix);

    if (!identificadorEvento || !pixRepresentaPagamentoConfirmado(pix)) {
      console.info("PIX Efí ignorado por payload sem confirmacao.", {
        txid: pix.txid,
        endToEndId: pix.endToEndId,
      });
      resultados.push({
        status: "ignorado",
        identificadorEvento: identificadorEvento ?? "sem_identificador",
        txid: pix.txid,
      });
      continue;
    }

    const resultado = await confirmarPagamentoPixEfi({
      pix,
      identificadorEvento,
    });

    if (resultado.duplicado) {
      console.info("Webhook PIX Efí duplicado ignorado.", {
        identificadorEvento,
        txid: pix.txid,
      });
      resultados.push({
        status: "duplicado",
        identificadorEvento,
        txid: pix.txid,
        pedidoId: resultado.pedidoId,
        pagamentoId: resultado.pagamentoId,
      });
      continue;
    }

    if ("erro" in resultado && resultado.erro) {
      console.error("Erro ao processar webhook PIX Efí.", {
        identificadorEvento,
        txid: pix.txid,
        message: resultado.erro,
      });
      resultados.push({
        status: "erro",
        identificadorEvento,
        txid: pix.txid,
      });
      continue;
    }

    if (!resultado.confirmadoAgora) {
      console.info("Webhook PIX Efí sem nova alteracao de pagamento.", {
        identificadorEvento,
        txid: pix.txid,
        pedidoId: resultado.pedidoId,
        pagamentoId: resultado.pagamentoId,
      });
      resultados.push({
        status: "pagamento_ja_confirmado",
        identificadorEvento,
        txid: pix.txid,
        pedidoId: resultado.pedidoId,
        pagamentoId: resultado.pagamentoId,
      });
      continue;
    }

    console.info("Pagamento PIX Efí confirmado pelo webhook.", {
      identificadorEvento,
      txid: pix.txid,
      pedidoId: resultado.pedidoId,
      pagamentoId: resultado.pagamentoId,
    });

    if (resultado.pedidoId) {
      const pedidoEmail = await buscarPedidoEmailPorId(resultado.pedidoId);

      if (!pedidoEmail) {
        console.error("Pedido nao encontrado para email PIX aprovado.", {
          identificadorEvento,
          pedidoId: resultado.pedidoId,
        });
      } else {
        await enviarEmailPagamentoPixAprovado(pedidoEmail);
      }
    }

    resultados.push({
      status: "pagamento_confirmado",
      identificadorEvento,
      txid: pix.txid,
      pedidoId: resultado.pedidoId,
      pagamentoId: resultado.pagamentoId,
    });
  }

  return resultados;
}
