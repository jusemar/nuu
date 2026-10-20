import type { EmailPedidoResumo, EmailTemplate } from "../types";
import {
  formatarMoedaEmail,
  montarLayoutEmail,
  montarLinhasItensHtml,
  montarLinhasItensTexto,
  montarResumoTotaisHtml,
} from "./helpers";

export function montarEmailPagamentoStripeAprovado(
  pedido: EmailPedidoResumo,
): EmailTemplate {
  const semRecursos = pedido.statusPedido === "pagamento_recebido_sem_recursos";
  const subject = `Pagamento aprovado - pedido ${pedido.numeroPedido}`;
  const html = montarLayoutEmail({
    titulo: "Pagamento aprovado",
    resumo: `O pagamento do pedido ${pedido.numeroPedido} foi aprovado.`,
    conteudo: `
      <p style="margin:0 0 16px;color:#374151;line-height:1.6;">Ola, ${pedido.nomeCliente}. Seu pagamento por cartao foi aprovado com sucesso. ${semRecursos ? "O pedido precisa de analise antes do atendimento; nossa equipe entrara em contato para tratamento ou reembolso." : ""}</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${montarLinhasItensHtml(pedido.itens)}
      </table>
      ${montarResumoTotaisHtml(pedido)}
    `,
  });
  const text = [
    `Pagamento aprovado - pedido ${pedido.numeroPedido}`,
    "",
    `Ola, ${pedido.nomeCliente}. Seu pagamento por cartao foi aprovado.`,
    ...(semRecursos ? ["O pedido precisa de analise antes do atendimento. Nossa equipe entrara em contato para tratamento ou reembolso."] : []),
    "",
    montarLinhasItensTexto(pedido.itens),
    "",
    `Total pago: ${formatarMoedaEmail(pedido.totalEmCentavos)}`,
  ].join("\n");

  return { subject, html, text };
}
