import "server-only";

import { DADOS_CONTATO_EMPRESA } from "@/features/configuracoes-loja/constants/dados-contato-empresa.server";
import {
  obterRemetenteEmailTransacional,
  obterResend,
} from "@/lib/email/cliente-resend";

import type { DadosFormularioContato } from "../schemas/formulario-contato.schema";

function escaparHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function enviarEmailContato(dados: DadosFormularioContato) {
  const enviadoEm = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const mensagemHtml = escaparHtml(dados.mensagem).replaceAll("\n", "<br />");

  const resultado = await obterResend().emails.send({
    from: obterRemetenteEmailTransacional(),
    to: DADOS_CONTATO_EMPRESA.emailAtendimento,
    replyTo: dados.email,
    subject: `[Contato pelo site] ${dados.assunto}`,
    text: [
      `Nome: ${dados.nome}`,
      `E-mail: ${dados.email}`,
      `Assunto: ${dados.assunto}`,
      `Enviado em: ${enviadoEm}`,
      "",
      dados.mensagem,
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
      <h1 style="font-size:20px">Nova mensagem pelo site</h1>
      <p><strong>Nome:</strong> ${escaparHtml(dados.nome)}</p>
      <p><strong>E-mail:</strong> ${escaparHtml(dados.email)}</p>
      <p><strong>Assunto:</strong> ${escaparHtml(dados.assunto)}</p>
      <p><strong>Data/hora:</strong> ${escaparHtml(enviadoEm)}</p>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0" />
      <p>${mensagemHtml}</p>
    </div>`,
    tags: [{ name: "tipo", value: "contato_site" }],
  });

  if (resultado.error) throw new Error("RESEND_NAO_ENVIOU");
}
