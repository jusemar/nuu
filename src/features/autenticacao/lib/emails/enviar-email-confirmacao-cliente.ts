import "server-only";

import { DADOS_EMPRESA } from "@/features/configuracoes-loja/constants/dados-empresa";
import {
  obterRemetenteEmailTransacional,
  obterResend,
} from "@/lib/email/cliente-resend";

function escaparHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function sanitizarErro(mensagem: string) {
  return mensagem
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+/gi, "[email oculto]")
    .replace(/([?&]token=)[^&\s]+/gi, "$1[oculto]")
    .replace(/re_[A-Za-z0-9_-]+/g, "[chave oculta]")
    .slice(0, 600);
}

export async function enviarEmailConfirmacaoCliente({
  destinatario,
  urlConfirmacao,
}: {
  destinatario: string;
  urlConfirmacao: string;
}) {
  const resultado = await obterResend().emails.send({
    from: obterRemetenteEmailTransacional(),
    to: destinatario,
    subject: `Confirme seu novo e-mail da ${DADOS_EMPRESA.marca}`,
    text: `Confirme seu novo e-mail da ${DADOS_EMPRESA.marca} usando este link em até 30 minutos: ${urlConfirmacao}\n\nSeu endereço atual continuará válido até a confirmação.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <h1 style="font-size:20px">Confirme seu novo e-mail</h1>
        <p>Use o botão abaixo para confirmar este endereço na sua conta ${DADOS_EMPRESA.marca}.</p>
        <p><a href="${escaparHtml(urlConfirmacao)}" style="display:inline-block;border-radius:6px;background:#0c447c;color:#fff;padding:10px 16px;text-decoration:none">Confirmar novo e-mail</a></p>
        <p>O link expira em 30 minutos e pode ser usado somente uma vez.</p>
        <p>Seu endereço atual continuará válido enquanto a confirmação não for concluída.</p>
      </div>
    `,
  });
  if (resultado.error) {
    // Destinatário e token nunca são registrados.
    console.error("[autenticacao:cliente:confirmacao-email:transporte]", {
      status: resultado.error.statusCode,
      tipo: resultado.error.name,
      mensagem: sanitizarErro(resultado.error.message),
    });
    throw new Error("Falha ao enviar confirmação de email.");
  }
}
