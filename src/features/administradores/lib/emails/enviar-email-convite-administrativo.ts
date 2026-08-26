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

export async function enviarEmailConviteAdministrativo({
  destinatario,
  nome,
  url,
}: {
  destinatario: string;
  nome: string;
  url: string;
}) {
  const resultado = await obterResend().emails.send({
    from: obterRemetenteEmailTransacional(),
    to: destinatario,
    subject: `Convite para acessar o painel ${DADOS_EMPRESA.marca}`,
    text: `Olá, ${nome}. Você recebeu um convite para acessar o painel administrativo ${DADOS_EMPRESA.marca}. Ative-o em até 24 horas: ${url}\n\nSe não reconhece este convite, ignore este e-mail.`,
    html: `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6"><h1 style="font-size:20px">Convite para o painel ${DADOS_EMPRESA.marca}</h1><p>Olá, ${escaparHtml(nome)}.</p><p>Você recebeu um convite para acessar o painel administrativo ${DADOS_EMPRESA.marca}.</p><p><a href="${escaparHtml(url)}" style="display:inline-block;border-radius:6px;background:#0f172a;color:#fff;padding:10px 16px;text-decoration:none">Ativar acesso</a></p><p>Este convite expira em 24 horas e só pode ser usado uma vez.</p><p>Se não reconhece este convite, ignore este e-mail.</p></div>`,
  });
  if (resultado.error) throw new Error("FALHA_ENVIO_CONVITE");
}
