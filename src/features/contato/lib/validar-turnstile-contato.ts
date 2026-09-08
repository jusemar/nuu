import "server-only";

import { z } from "zod";

const respostaTurnstileSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
});

function normalizarHostname(hostname: string) {
  const semPorta = hostname.split(":")[0]?.toLowerCase() ?? "";
  return semPorta === "127.0.0.1" ? "localhost" : semPorta;
}

export async function validarTurnstileContato({
  token,
  enderecoIp,
  hostnameEsperado,
}: {
  token: string;
  enderecoIp: string;
  hostnameEsperado: string;
}) {
  const segredo = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!segredo || !token) return false;

  const corpo = new URLSearchParams({ secret: segredo, response: token });
  if (enderecoIp !== "desconhecido") corpo.set("remoteip", enderecoIp);

  try {
    const resposta = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: corpo,
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!resposta.ok) return false;

    const resultado = respostaTurnstileSchema.safeParse(await resposta.json());
    if (!resultado.success || !resultado.data.success) return false;
    if (resultado.data.action && resultado.data.action !== "contato")
      return false;

    const hostnameRecebido = resultado.data.hostname;
    if (
      hostnameRecebido &&
      normalizarHostname(hostnameRecebido) !==
        normalizarHostname(hostnameEsperado)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
