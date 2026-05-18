import type { EmailPixPendente, EmailTemplate } from "../types";
import {
  escaparHtml,
  formatarDataEmail,
  formatarMoedaEmail,
  montarLayoutEmail,
  montarLinhasItensHtml,
  montarLinhasItensTexto,
  montarResumoTotaisHtml,
} from "./helpers";

function separarQrCodeInline(qrCode: string) {
  const match = qrCode.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    return {
      src: qrCode,
      attachments: [],
    };
  }

  return {
    src: "cid:pix-qrcode",
    attachments: [
      {
        filename: "pix-qrcode.png",
        content: match[2],
        contentType: match[1],
        contentId: "pix-qrcode",
      },
    ],
  };
}

export function montarEmailPixPendente(
  pedido: EmailPixPendente,
): EmailTemplate {
  const subject = `PIX pendente - pedido ${pedido.numeroPedido}`;
  const qrCode = separarQrCodeInline(pedido.pix.qrCode);
  const html = montarLayoutEmail({
    titulo: "PIX aguardando pagamento",
    resumo: `Use o QR Code ou copia e cola para pagar o pedido ${pedido.numeroPedido}.`,
    conteudo: `
      <p style="margin:0 0 16px;color:#374151;line-height:1.6;">Ola, ${pedido.nomeCliente}. Seu pedido foi criado e o PIX esta aguardando pagamento.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:18px;margin-bottom:20px;">
        <div style="color:#6b7280;font-size:13px;">Valor</div>
        <div style="color:#111827;font-size:24px;font-weight:700;margin-top:4px;">${formatarMoedaEmail(pedido.totalEmCentavos)}</div>
        <div style="color:#6b7280;font-size:13px;margin-top:10px;">Expira em ${formatarDataEmail(pedido.pix.expiresAt)}</div>
      </div>
      <div style="text-align:center;margin:18px 0;">
        <img src="${escaparHtml(qrCode.src)}" alt="QR Code PIX do pedido ${escaparHtml(pedido.numeroPedido)}" width="220" style="display:inline-block;max-width:220px;width:100%;height:auto;border:1px solid #e5e7eb;border-radius:8px;" />
      </div>
      <div style="margin:18px 0;">
        <div style="color:#374151;font-weight:700;margin-bottom:8px;">PIX copia e cola</div>
        <div style="word-break:break-all;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#111827;font-size:13px;line-height:1.5;">${escaparHtml(pedido.pix.copiaECola)}</div>
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${montarLinhasItensHtml(pedido.itens)}
      </table>
      ${montarResumoTotaisHtml(pedido)}
    `,
  });
  const text = [
    `PIX pendente - pedido ${pedido.numeroPedido}`,
    "",
    `Ola, ${pedido.nomeCliente}. Seu PIX esta aguardando pagamento.`,
    `Valor: ${formatarMoedaEmail(pedido.totalEmCentavos)}`,
    `Expira em: ${formatarDataEmail(pedido.pix.expiresAt)}`,
    "",
    "PIX copia e cola:",
    pedido.pix.copiaECola,
    "",
    montarLinhasItensTexto(pedido.itens),
  ].join("\n");

  return { subject, html, text, attachments: qrCode.attachments };
}
