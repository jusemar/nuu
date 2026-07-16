import "server-only";

import { Resend } from "resend";

let resend: Resend | null = null;

/** Instância única do Resend compartilhada pelos emails do sistema. */
export function obterResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY nao configurada.");
  }

  resend ??= new Resend(apiKey);
  return resend;
}

/** Remetente transacional único, configurado no ambiente da aplicação. */
export function obterRemetenteEmailTransacional() {
  const remetente = process.env.RESEND_FROM_EMAIL?.trim();

  if (!remetente) {
    throw new Error("RESEND_FROM_EMAIL nao configurada.");
  }

  return remetente;
}
