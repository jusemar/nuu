import { and, eq, ne } from "drizzle-orm";
import type Stripe from "stripe";

import {
  checkoutPagamentosTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidosTable,
  checkoutStripeWebhookEventosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { montarDescricaoPagamentoAprovado } from "../../admin-pedidos/montar-descricao-historico-pedido";
import { enviarEmailPagamentoStripeAprovado } from "../../emails/email-service";
import { resolverStatusOperacionalPedidoAposPagamento } from "../../pedidos/resolver-status-operacional-pedido";
import { buscarPedidoEmailPorId } from "../../../queries/pedido/buscar-pedido-email";
import { obterStripe, obterWebhookSecretStripe } from "./cliente-stripe";

type ConfirmarPagamentoStripeParams = {
  eventId: string;
  eventType: string;
  pedidoId: string;
  pagamentoId: string;
  transactionId: string;
  providerResponse: unknown;
};

type ResultadoProcessamentoWebhookStripe = {
  status:
    | "ignorado"
    | "duplicado"
    | "pagamento_confirmado"
    | "pagamento_ja_confirmado";
  eventId: string;
  eventType: string;
  pedidoId?: string;
  pagamentoId?: string;
};

type SincronizarPagamentoCheckoutStripeParams = {
  sessionId: string;
  numeroPedido?: string;
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
  eventId,
  eventType,
  pedidoId,
  pagamentoId,
  transactionId,
  providerResponse,
}: ConfirmarPagamentoStripeParams) {
  return dbTransacional.transaction(async (tx) => {
    const eventoInserido = await tx
      .insert(checkoutStripeWebhookEventosTable)
      .values({
        stripeEventId: eventId,
        tipoEvento: eventType,
        pedidoId,
        pagamentoId,
        statusProcessamento: "recebido",
        payload: providerResponse,
      })
      .onConflictDoNothing({
        target: checkoutStripeWebhookEventosTable.stripeEventId,
      })
      .returning({ id: checkoutStripeWebhookEventosTable.id });

    if (eventoInserido.length === 0) {
      return {
        confirmadoAgora: false,
        duplicado: true,
      };
    }

    const pagamentoAtual = await tx.query.checkoutPagamentosTable.findFirst({
      where: and(
        eq(checkoutPagamentosTable.id, pagamentoId),
        eq(checkoutPagamentosTable.pedidoId, pedidoId),
      ),
    });
    const pedidoAtual = await tx.query.checkoutPedidosTable.findFirst({
      where: eq(checkoutPedidosTable.id, pedidoId),
    });

    if (!pagamentoAtual || !pedidoAtual) {
      await tx
        .update(checkoutStripeWebhookEventosTable)
        .set({
          statusProcessamento: "erro",
          erro: "Pagamento ou pedido nao encontrado para webhook Stripe.",
          updatedAt: new Date(),
        })
        .where(eq(checkoutStripeWebhookEventosTable.stripeEventId, eventId));

      throw new Error(
        "Pagamento ou pedido não encontrado para webhook Stripe.",
      );
    }

    if (
      pagamentoAtual.status === "paid" &&
      pedidoAtual.pagamentoStatus === "paid"
    ) {
      await tx
        .update(checkoutStripeWebhookEventosTable)
        .set({
          statusProcessamento: "ignorado_pagamento_ja_confirmado",
          updatedAt: new Date(),
        })
        .where(eq(checkoutStripeWebhookEventosTable.stripeEventId, eventId));

      return {
        confirmadoAgora: false,
        duplicado: false,
      };
    }

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
        status: resolverStatusOperacionalPedidoAposPagamento(
          pedidoAtual.status,
        ),
        pagamentoStatus: "paid",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(checkoutPedidosTable.id, pedidoId),
          ne(checkoutPedidosTable.pagamentoStatus, "paid"),
        ),
      )
      .returning({
        id: checkoutPedidosTable.id,
        numeroPedido: checkoutPedidosTable.numeroPedido,
        status: checkoutPedidosTable.status,
      });

    const pedidoAtualizado = pedidosAtualizados[0];

    const houveConfirmacao =
      pagamentosAtualizados.length > 0 || pedidosAtualizados.length > 0;

    if (houveConfirmacao && pedidoAtualizado) {
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
          stripeEventId: eventId,
          stripeEventType: eventType,
        },
      });
    }

    await tx
      .update(checkoutStripeWebhookEventosTable)
      .set({
        statusProcessamento: houveConfirmacao
          ? "processado"
          : "ignorado_sem_alteracao",
        updatedAt: new Date(),
      })
      .where(eq(checkoutStripeWebhookEventosTable.stripeEventId, eventId));

    return {
      confirmadoAgora: houveConfirmacao,
      duplicado: false,
    };
  });
}

async function enviarEmailConfirmacaoPagamentoStripe({
  eventId,
  pedidoId,
}: {
  eventId: string;
  pedidoId: string;
}) {
  const pedidoEmail = await buscarPedidoEmailPorId(pedidoId);

  if (!pedidoEmail) {
    console.error("Pedido nao encontrado para email Stripe aprovado.", {
      eventId,
      pedidoId,
    });
    return;
  }

  await enviarEmailPagamentoStripeAprovado(pedidoEmail);
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

export async function processarWebhookStripe(
  event: Stripe.Event,
): Promise<ResultadoProcessamentoWebhookStripe> {
  console.info("Webhook Stripe recebido.", {
    eventId: event.id,
    eventType: event.type,
  });

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "payment_intent.succeeded"
  ) {
    console.info("Webhook Stripe ignorado por tipo nao acompanhado.", {
      eventId: event.id,
      eventType: event.type,
    });

    return {
      status: "ignorado",
      eventId: event.id,
      eventType: event.type,
    };
  }

  const metadata = obterMetadataPagamentoStripe(event);

  if (!metadata?.pedidoId || !metadata.pagamentoId) {
    console.error("Webhook Stripe sem metadata de pedido/pagamento.", {
      eventId: event.id,
      eventType: event.type,
    });
    return {
      status: "ignorado",
      eventId: event.id,
      eventType: event.type,
    };
  }

  if (!metadata.pago) {
    console.info(
      "Webhook Stripe ignorado porque pagamento ainda nao esta pago.",
      {
        eventId: event.id,
        eventType: event.type,
        pedidoId: metadata.pedidoId,
        pagamentoId: metadata.pagamentoId,
      },
    );

    return {
      status: "ignorado",
      eventId: event.id,
      eventType: event.type,
      pedidoId: metadata.pedidoId,
      pagamentoId: metadata.pagamentoId,
    };
  }

  const resultadoConfirmacao = await confirmarPagamentoStripe({
    eventId: event.id,
    eventType: event.type,
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

  if (resultadoConfirmacao.duplicado) {
    console.info("Webhook Stripe duplicado ignorado.", {
      eventId: event.id,
      eventType: event.type,
      pedidoId: metadata.pedidoId,
      pagamentoId: metadata.pagamentoId,
    });

    return {
      status: "duplicado",
      eventId: event.id,
      eventType: event.type,
      pedidoId: metadata.pedidoId,
      pagamentoId: metadata.pagamentoId,
    };
  }

  if (!resultadoConfirmacao.confirmadoAgora) {
    console.info("Webhook Stripe sem nova alteracao de pagamento.", {
      eventId: event.id,
      eventType: event.type,
      pedidoId: metadata.pedidoId,
      pagamentoId: metadata.pagamentoId,
    });

    return {
      status: "pagamento_ja_confirmado",
      eventId: event.id,
      eventType: event.type,
      pedidoId: metadata.pedidoId,
      pagamentoId: metadata.pagamentoId,
    };
  }

  console.info("Pagamento Stripe confirmado pelo webhook.", {
    eventId: event.id,
    eventType: event.type,
    pedidoId: metadata.pedidoId,
    pagamentoId: metadata.pagamentoId,
    transactionId: metadata.transactionId,
  });

  await enviarEmailConfirmacaoPagamentoStripe({
    eventId: event.id,
    pedidoId: metadata.pedidoId,
  });

  return {
    status: "pagamento_confirmado",
    eventId: event.id,
    eventType: event.type,
    pedidoId: metadata.pedidoId,
    pagamentoId: metadata.pagamentoId,
  };
}

export async function sincronizarPagamentoCheckoutStripe({
  sessionId,
  numeroPedido,
}: SincronizarPagamentoCheckoutStripeParams) {
  if (!sessionId.startsWith("cs_")) {
    return;
  }

  const session = await obterStripe().checkout.sessions.retrieve(sessionId);
  const pedidoId = session.metadata?.pedidoId;
  const pagamentoId = session.metadata?.pagamentoId;

  if (
    session.mode !== "payment" ||
    session.payment_status !== "paid" ||
    !pedidoId ||
    !pagamentoId ||
    (numeroPedido && session.metadata?.numeroPedido !== numeroPedido)
  ) {
    console.info("Checkout Session Stripe sem pagamento sincronizavel.", {
      sessionId,
      numeroPedido,
      sessionStatus: session.status,
      paymentStatus: session.payment_status,
    });
    return;
  }

  const transactionId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.id;
  const eventId = `checkout_session_success:${session.id}`;
  const eventType = "checkout.session.success_page";
  const resultadoConfirmacao = await confirmarPagamentoStripe({
    eventId,
    eventType,
    pedidoId,
    pagamentoId,
    transactionId,
    providerResponse: {
      stripeCheckoutSessionSincronizada: session,
    },
  });

  if (resultadoConfirmacao.confirmadoAgora) {
    console.info("Pagamento Stripe confirmado pelo retorno do checkout.", {
      sessionId,
      pedidoId,
      pagamentoId,
      transactionId,
    });

    await enviarEmailConfirmacaoPagamentoStripe({
      eventId,
      pedidoId,
    });
  }
}
