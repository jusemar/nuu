import "server-only";

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

function sanitizarMensagemResend(mensagem: string) {
  return mensagem
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+/gi, "[endereço de email oculto]")
    .replace(/re_[A-Za-z0-9_-]+/g, "[chave oculta]")
    .replace(/([?&](?:token|key|api_key)=)[^&\s]+/gi, "$1[oculto]")
    .slice(0, 600);
}

type EnviarEmailRedefinicaoSenhaAdminParams = {
  destinatario: string;
  urlRedefinicao: string;
};

export async function enviarEmailRedefinicaoSenhaAdmin({
  destinatario,
  urlRedefinicao,
}: EnviarEmailRedefinicaoSenhaAdminParams) {
  const cliente = obterResend();
  const remetente = obterRemetenteEmailTransacional();
  const urlSegura = escaparHtml(urlRedefinicao);
  const resultado = await cliente.emails.send({
    from: remetente,
    to: destinatario,
    subject: "Redefinição de senha do painel administrativo",
    text: `Recebemos uma solicitação para redefinir sua senha do painel administrativo. Use este link em até 30 minutos: ${urlRedefinicao}\n\nSe você não solicitou a alteração, ignore este email.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <h1 style="font-size:20px">Redefinição de senha</h1>
        <p>Recebemos uma solicitação para redefinir sua senha do painel administrativo.</p>
        <p><a href="${urlSegura}" style="display:inline-block;border-radius:6px;background:#0f172a;color:#fff;padding:10px 16px;text-decoration:none">Criar nova senha</a></p>
        <p>Este link expira em 30 minutos e só pode ser usado uma vez.</p>
        <p>Se você não solicitou a alteração, ignore este email.</p>
      </div>
    `,
  });

  if (resultado.error) {
    // Não registra endereço, token ou URL de recuperação.
    console.error("[autenticacao:recuperacao-senha:email]", {
      status: resultado.error.statusCode,
      tipo: resultado.error.name,
      mensagem: sanitizarMensagemResend(resultado.error.message),
      remetente: "configuracao_transacional_compartilhada",
    });
    throw new Error("Falha ao enviar email de recuperação.");
  }
}
