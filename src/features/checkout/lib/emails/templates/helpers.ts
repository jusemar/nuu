import type { EmailPedidoItem } from "../types";

export function formatarMoedaEmail(valorEmCentavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorEmCentavos / 100);
}

export function formatarDataEmail(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

export function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function montarLinhasItensHtml(itens: EmailPedidoItem[]) {
  return itens
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
            <strong style="color:#111827;">${escaparHtml(item.nome)}</strong>
            <div style="color:#6b7280;font-size:13px;">Qtd. ${item.quantidade} x ${formatarMoedaEmail(item.precoUnitarioEmCentavos)}</div>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-weight:600;">
            ${formatarMoedaEmail(item.totalEmCentavos)}
          </td>
        </tr>
      `,
    )
    .join("");
}

export function montarLinhasItensTexto(itens: EmailPedidoItem[]) {
  return itens
    .map(
      (item) =>
        `- ${item.nome} | ${item.quantidade} x ${formatarMoedaEmail(item.precoUnitarioEmCentavos)} = ${formatarMoedaEmail(item.totalEmCentavos)}`,
    )
    .join("\n");
}

export function montarLayoutEmail({
  titulo,
  resumo,
  conteudo,
}: {
  titulo: string;
  resumo: string;
  conteudo: string;
}) {
  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escaparHtml(titulo)}</title>
      </head>
      <body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#111827;padding:28px 32px;">
                    <div style="color:#ffffff;font-size:22px;font-weight:700;">${escaparHtml(titulo)}</div>
                    <div style="color:#d1d5db;font-size:14px;margin-top:8px;">${escaparHtml(resumo)}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px;">
                    ${conteudo}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.5;">
                    Este email foi enviado automaticamente sobre seu pedido. Se voce nao reconhece esta compra, entre em contato com a loja.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function montarResumoTotaisHtml({
  subtotalEmCentavos,
  freteEmCentavos,
  descontoEmCentavos,
  totalEmCentavos,
}: {
  subtotalEmCentavos: number;
  freteEmCentavos: number;
  descontoEmCentavos: number;
  totalEmCentavos: number;
}) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">
      <tr>
        <td style="padding:4px 0;color:#6b7280;">Subtotal</td>
        <td align="right" style="padding:4px 0;color:#111827;">${formatarMoedaEmail(subtotalEmCentavos)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#6b7280;">Frete</td>
        <td align="right" style="padding:4px 0;color:#111827;">${formatarMoedaEmail(freteEmCentavos)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#6b7280;">Desconto</td>
        <td align="right" style="padding:4px 0;color:#111827;">-${formatarMoedaEmail(descontoEmCentavos)}</td>
      </tr>
      <tr>
        <td style="padding-top:12px;color:#111827;font-weight:700;font-size:18px;">Total</td>
        <td align="right" style="padding-top:12px;color:#111827;font-weight:700;font-size:18px;">${formatarMoedaEmail(totalEmCentavos)}</td>
      </tr>
    </table>
  `;
}
