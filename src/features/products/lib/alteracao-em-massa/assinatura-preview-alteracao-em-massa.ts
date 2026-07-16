import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { OperacaoAlteracaoEmMassa } from "../../schemas/alteracao-em-massa/operacoes-alteracao-em-massa.schema";

export type ConteudoAssinaturaPreview = {
  produtosIds: string[];
  operacoes: OperacaoAlteracaoEmMassa[];
  versoes: Record<string, string>;
  emitidoEm: number;
};

function segredo() {
  const valor = process.env.BETTER_AUTH_SECRET;
  if (!valor) throw new Error("Segredo de autenticação indisponível.");
  return valor;
}

function assinar(conteudo: string) {
  return createHmac("sha256", segredo()).update(conteudo).digest("base64url");
}

export function criarAssinaturaPreview(conteudo: ConteudoAssinaturaPreview) {
  const corpo = Buffer.from(JSON.stringify(conteudo)).toString("base64url");
  return `${corpo}.${assinar(corpo)}`;
}

export function validarAssinaturaPreview(token: string) {
  const [corpo, assinaturaRecebida] = token.split(".");
  if (!corpo || !assinaturaRecebida) return null;
  const assinaturaEsperada = assinar(corpo);
  const recebida = Buffer.from(assinaturaRecebida);
  const esperada = Buffer.from(assinaturaEsperada);
  if (
    recebida.length !== esperada.length ||
    !timingSafeEqual(recebida, esperada)
  ) {
    return null;
  }

  try {
    const conteudo = JSON.parse(
      Buffer.from(corpo, "base64url").toString("utf8"),
    ) as ConteudoAssinaturaPreview;
    if (Date.now() - conteudo.emitidoEm > 30 * 60 * 1000) return null;
    return conteudo;
  } catch {
    return null;
  }
}
