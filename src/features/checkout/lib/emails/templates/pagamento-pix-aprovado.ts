import type { EmailPedidoResumo, EmailTemplate } from "../types";
import {
  formatarMoedaEmail,
  montarLayoutEmail,
  montarLinhasItensHtml,
  montarLinhasItensTexto,
  montarResumoTotaisHtml,
} from "./helpers";

export function montarEmailPagamentoPixAprovado(
  pedido: EmailPedidoResumo,
): EmailTemplate {
  const subject = `Pagamento PIX aprovado - pedido ${pedido.numeroPedido}`;
  const html = montarLayoutEmail({
    titulo: "Pagamento PIX aprovado",
    resumo: `O pagamento PIX do pedido ${pedido.numeroPedido} foi confirmado.`,
    conteudo: `
      <p style="margin:0 0 16px;color:#374151;line-height:1.6;">Ola, ${pedido.nomeCliente}. Recebemos seu pagamento PIX e seu pedido entrou em processamento.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${montarLinhasItensHtml(pedido.itens)}
      </table>
      ${montarResumoTotaisHtml(pedido)}
    `,
  });
  const text = [
    `Pagamento PIX aprovado - pedido ${pedido.numeroPedido}`,
    "",
    `Ola, ${pedido.nomeCliente}. Recebemos seu pagamento PIX.`,
    "",
    montarLinhasItensTexto(pedido.itens),
    "",
    `Total pago: ${formatarMoedaEmail(pedido.totalEmCentavos)}`,
  ].join("\n");

  return { subject, html, text };
}
