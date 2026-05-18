import "server-only";

import { obterRemetenteEmailTransacional, obterResend } from "./cliente-resend";
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

  return resend.emails.send({
    from: obterRemetenteEmailTransacional(),
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
  contexto: Record<string, unknown>;
  envio: () => Promise<unknown>;
}) {
  try {
    const resultado = await envio();

    if (
      resultado &&
      typeof resultado === "object" &&
      "error" in resultado &&
      resultado.error
    ) {
      throw new Error(JSON.stringify(resultado.error));
    }

    console.info("Email transacional enviado.", contexto);

    return resultado;
  } catch (error) {
    console.error("Falha ao enviar email transacional.", {
      ...contexto,
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
      email: pedido.emailCliente,
    },
    envio: () =>
      enviarEmailTransacional({
        to: pedido.emailCliente,
        template: montarEmailPedidoRecebido(pedido),
        tags: [
          { name: "tipo", value: "pedido_recebido" },
          { name: "pedido", value: pedido.numeroPedido },
        ],
      }),
  });
}

export function enviarEmailPagamentoStripeAprovado(pedido: EmailPedidoResumo) {
  return executarEnvioResiliente({
    contexto: {
      tipo: "pagamento_stripe_aprovado",
      numeroPedido: pedido.numeroPedido,
      email: pedido.emailCliente,
    },
    envio: () =>
      enviarEmailTransacional({
        to: pedido.emailCliente,
        template: montarEmailPagamentoStripeAprovado(pedido),
        tags: [
          { name: "tipo", value: "pagamento_stripe_aprovado" },
          { name: "pedido", value: pedido.numeroPedido },
        ],
      }),
  });
}

export function enviarEmailPixPendente(pedido: EmailPixPendente) {
  return executarEnvioResiliente({
    contexto: {
      tipo: "pix_pendente",
      numeroPedido: pedido.numeroPedido,
      email: pedido.emailCliente,
    },
    envio: () =>
      enviarEmailTransacional({
        to: pedido.emailCliente,
        template: montarEmailPixPendente(pedido),
        tags: [
          { name: "tipo", value: "pix_pendente" },
          { name: "pedido", value: pedido.numeroPedido },
        ],
      }),
  });
}
