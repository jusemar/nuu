import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const algoritmo = "aes-256-gcm";
const versao = "v1";
const chavesSensiveis = new Set([
  "token",
  "tokencliente",
  "token_cliente",
  "authorization",
  "apikey",
  "senha",
  "secret",
  "credencial",
]);

function obterChaveCriptografia() {
  const segredo = process.env.BETTER_AUTH_SECRET;

  if (!segredo) {
    throw new Error("BETTER_AUTH_SECRET não configurado para proteger tokens.");
  }

  return createHash("sha256").update(segredo).digest();
}

export function criptografarTokenLaquila(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algoritmo, obterChaveCriptografia(), iv);
  const criptografado = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const autenticacao = cipher.getAuthTag();

  return [
    versao,
    iv.toString("base64"),
    autenticacao.toString("base64"),
    criptografado.toString("base64"),
  ].join(":");
}

export function descriptografarTokenLaquila(valorCriptografado: string) {
  const [versaoAtual, ivBase64, autenticacaoBase64, tokenBase64] =
    valorCriptografado.split(":");

  if (
    versaoAtual !== versao ||
    !ivBase64 ||
    !autenticacaoBase64 ||
    !tokenBase64
  ) {
    throw new Error("Token Laquila armazenado em formato inválido.");
  }

  const decipher = createDecipheriv(
    algoritmo,
    obterChaveCriptografia(),
    Buffer.from(ivBase64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(autenticacaoBase64, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(tokenBase64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function normalizarChaveSensivel(chave: string) {
  return chave.replace(/[\s_-]/g, "").toLowerCase();
}

function sanitizarValor(valor: unknown): unknown {
  if (Array.isArray(valor)) {
    return valor.map((item) => sanitizarValor(item));
  }

  if (valor && typeof valor === "object") {
    return removerSegredosResumoLaquila(valor as Record<string, unknown>);
  }

  return valor;
}

export function removerSegredosResumoLaquila<T extends Record<string, unknown>>(
  resumo: T,
) {
  return Object.fromEntries(
    Object.entries(resumo).map(([chave, valor]) => [
      chave,
      chavesSensiveis.has(normalizarChaveSensivel(chave))
        ? "[removido]"
        : sanitizarValor(valor),
    ]),
  ) as T;
}
