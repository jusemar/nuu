import "server-only";

import { obterRemetenteEmailTransacional, obterResend } from "./cliente-resend";
import {
  extrairErroResendEmail,
  extrairMessageIdResendEmail,
  montarContextoLogEmailTransacional,
} from "./logs-email-transacional";
import { normalizarValorTagEmailTransacional } from "./tags-email-transacional";
import { montarEmailPagamentoStripeAprovado } from "./templates/pagamento-stripe-aprovado";
import { montarEmailPedidoRecebido } from "./templates/pedido-recebido";
import { montarEmailPixPendente } from "./templates/pix-pendente";
import type {
  EmailPedidoResumo,
  EmailPixPendente,
  EmailTemplate,
} from "./types";

type EnviarEmailTransacionalParams = {
  to: string;
  template: EmailTemplate;
  tags?: { name: string; value: string }[];
};

async function enviarEmailTransacional({
  to,
  template,
  tags,
}: EnviarEmailTransacionalParams) {
  const resend = obterResend();
  const from = obterRemetenteEmailTransacional();

  return resend.emails.send({
    from,
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments: template.attachments,
    tags,
  });
}

async function executarEnvioResiliente({
  contexto,
  envio,
}: {
  contexto: {
    tipo: string;
    numeroPedido?: string;
    destinatario: string;
  };
  envio: () => Promise<unknown>;
}) {
  const contextoLog = montarContextoLogEmailTransacional({
    ...contexto,
    remetente: obterRemetenteEmailTransacional(),
  });

  try {
    console.info("Tentando enviar email transacional.", contextoLog);

    const resultado = await envio();
    const erroResend = extrairErroResendEmail(resultado);

    if (erroResend) {
      console.error("Falha Resend ao enviar email transacional.", {
        ...contextoLog,
        statusCode: erroResend.statusCode,
        name: erroResend.name,
        message: erroResend.message,
      });

      return null;
    }

    console.info("Email transacional enviado.", {
      ...contextoLog,
      messageId: extrairMessageIdResendEmail(resultado),
    });

    return resultado;
  } catch (error) {
    console.error("Falha ao enviar email transacional.", {
      ...contextoLog,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });

    return null;
  }
}

export function enviarEmailPedidoRecebido(pedido: EmailPedidoResumo) {
  return executarEnvioResiliente({
    contexto: {
      tipo: "pedido_recebido",
      numeroPedido: pedido.numeroPedido,
      destinatario: pedido.emailCliente,
    },
    envio: () =>
      enviarEmailTransacional({
        to: pedido.emailCliente,
        template: montarEmailPedidoRecebido(pedido),
        tags: [
          { name: "tipo", value: "pedido_recebido" },
          {
            name: "pedido",
            value: normalizarValorTagEmailTransacional(pedido.numeroPedido),
          },
        ],
      }),
  });
}

export function enviarEmailPagamentoStripeAprovado(pedido: EmailPedidoResumo) {
  return executarEnvioResiliente({
    contexto: {
      tipo: "pagamento_stripe_aprovado",
      numeroPedido: pedido.numeroPedido,
      destinatario: pedido.emailCliente,
    },
    envio: () =>
      enviarEmailTransacional({
        to: pedido.emailCliente,
        template: montarEmailPagamentoStripeAprovado(pedido),
        tags: [
          { name: "tipo", value: "pagamento_stripe_aprovado" },
          {
            name: "pedido",
            value: normalizarValorTagEmailTransacional(pedido.numeroPedido),
          },
        ],
      }),
  });
}

export function enviarEmailPixPendente(pedido: EmailPixPendente) {
  return executarEnvioResiliente({
    contexto: {
      tipo: "pix_pendente",
      numeroPedido: pedido.numeroPedido,
      destinatario: pedido.emailCliente,
    },
    envio: () =>
      enviarEmailTransacional({
        to: pedido.emailCliente,
        template: montarEmailPixPendente(pedido),
        tags: [
          { name: "tipo", value: "pix_pendente" },
          {
            name: "pedido",
            value: normalizarValorTagEmailTransacional(pedido.numeroPedido),
          },
        ],
      }),
  });
}
