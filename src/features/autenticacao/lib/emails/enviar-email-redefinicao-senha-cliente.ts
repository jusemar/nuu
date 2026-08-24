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

function sanitizarErro(mensagem: string) {
  return mensagem
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+/gi, "[email oculto]")
    .replace(/re_[A-Za-z0-9_-]+/g, "[chave oculta]")
    .replace(/\/reset-password\/[^?\s]+/gi, "/reset-password/[token oculto]")
    .replace(/([?&](?:token|key|api_key)=)[^&\s]+/gi, "$1[oculto]")
    .slice(0, 600);
}

export async function enviarEmailRedefinicaoSenhaCliente({
  destinatario,
  urlRedefinicao,
}: {
  destinatario: string;
  urlRedefinicao: string;
}) {
  const resultado = await obterResend().emails.send({
    from: obterRemetenteEmailTransacional(),
    to: destinatario,
    subject: "Redefina sua senha da Nuu",
    text: `Recebemos uma solicitação para redefinir sua senha da Nuu. Use este link em até 30 minutos: ${urlRedefinicao}\n\nSe você não solicitou a alteração, ignore este email.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <h1 style="font-size:20px">Crie uma nova senha</h1>
        <p>Recebemos uma solicitação para redefinir sua senha da Nuu.</p>
        <p><a href="${escaparHtml(urlRedefinicao)}" style="display:inline-block;border-radius:6px;background:#0c447c;color:#fff;padding:10px 16px;text-decoration:none">Redefinir minha senha</a></p>
        <p>Este link expira em 30 minutos e só pode ser usado uma vez.</p>
        <p>Se você não solicitou a alteração, ignore este email.</p>
      </div>
    `,
  });

  if (resultado.error) {
    // Endereço e URL nunca entram nos logs de falha do transporte.
    console.error("[autenticacao:cliente:recuperacao-senha:email]", {
      status: resultado.error.statusCode,
      tipo: resultado.error.name,
      mensagem: sanitizarErro(resultado.error.message),
    });
    throw new Error("Falha ao enviar email de recuperação do cliente.");
  }
}
