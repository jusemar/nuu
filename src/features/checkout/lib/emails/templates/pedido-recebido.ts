import type { EmailPedidoResumo, EmailTemplate } from "../types";
import {
  formatarMoedaEmail,
  montarLayoutEmail,
  montarLinhasItensHtml,
  montarLinhasItensTexto,
  montarResumoTotaisHtml,
} from "./helpers";

export function montarEmailPedidoRecebido(
  pedido: EmailPedidoResumo,
): EmailTemplate {
  const subject = `Pedido ${pedido.numeroPedido} recebido`;
  const html = montarLayoutEmail({
    titulo: "Pedido recebido",
    resumo: `Recebemos o pedido ${pedido.numeroPedido}.`,
    conteudo: `
      <p style="margin:0 0 16px;color:#374151;line-height:1.6;">Ola, ${pedido.nomeCliente}. Recebemos seu pedido e vamos acompanhar o pagamento para dar sequencia ao atendimento.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${montarLinhasItensHtml(pedido.itens)}
      </table>
      ${montarResumoTotaisHtml(pedido)}
    `,
  });
  const text = [
    `Pedido ${pedido.numeroPedido} recebido`,
    "",
    `Ola, ${pedido.nomeCliente}. Recebemos seu pedido.`,
    "",
    montarLinhasItensTexto(pedido.itens),
    "",
    `Total: ${formatarMoedaEmail(pedido.totalEmCentavos)}`,
  ].join("\n");

  return { subject, html, text };
}
