import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const DURACAO_CONVITE_ADMIN_MS = 24 * 60 * 60 * 1000;

export function gerarTokenConviteAdministrativo() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: calcularHashTokenConvite(token) };
}

export function calcularHashTokenConvite(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function compararHashTokenConvite(token: string, hashEsperado: string) {
  const calculado = Buffer.from(calcularHashTokenConvite(token), "hex");
  const esperado = Buffer.from(hashEsperado, "hex");
  return (
    calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
  );
}

export function calcularExpiracaoConvite(agora = new Date()) {
  return new Date(agora.getTime() + DURACAO_CONVITE_ADMIN_MS);
}
