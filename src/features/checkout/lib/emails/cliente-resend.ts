import "server-only";

import { Resend } from "resend";

let resend: Resend | null = null;

export function obterResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY nao configurada.");
  }

  resend ??= new Resend(apiKey);

  return resend;
}

export function obterRemetenteEmailTransacional() {
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL nao configurada.");
  }

  return from;
}
