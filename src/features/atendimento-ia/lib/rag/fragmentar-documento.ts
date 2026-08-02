import { createHash } from "node:crypto";

import type { FragmentoInstitucional } from "../../types/rag";

function hash(valor: string) {
  return createHash("sha256").update(valor.normalize("NFC")).digest("hex");
}

function tokenizar(texto: string) {
  return texto.match(/\p{L}[\p{L}\p{N}_-]*|\p{N}+(?:[.,]\p{N}+)*|[^\s]/gu) ?? [];
}

function separarBlocos(conteudo: string) {
  return conteudo
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((bloco) => bloco.trim())
    .filter(Boolean);
}

function identificarSecao(bloco: string, atual: string | null) {
  const primeiraLinha = bloco.split("\n", 1)[0]?.trim() ?? "";
  if (/^#{1,6}\s+\S/.test(primeiraLinha)) return primeiraLinha.replace(/^#{1,6}\s+/, "");
  if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][^.!?]{2,100}:$/.test(primeiraLinha)) {
    return primeiraLinha.slice(0, -1);
  }
  return atual;
}

export function calcularHashDocumento(conteudo: string) {
  return hash(conteudo);
}

export function fragmentarDocumentoInstitucional(
  conteudo: string,
  configuracao: { limiteTokens: number; sobreposicaoTokens: number },
): FragmentoInstitucional[] {
  if (
    configuracao.limiteTokens <= 0 ||
    configuracao.sobreposicaoTokens < 0 ||
    configuracao.sobreposicaoTokens >= configuracao.limiteTokens
  ) {
    throw new Error("CONFIGURACAO_FRAGMENTACAO_INVALIDA");
  }

  const unidades: Array<{ secao: string | null; token: string }> = [];
  let secao: string | null = null;
  for (const bloco of separarBlocos(conteudo)) {
    secao = identificarSecao(bloco, secao);
    const tokens = tokenizar(bloco);
    for (const token of tokens) unidades.push({ secao, token });
    unidades.push({ secao, token: "\n\n" });
  }
  if (unidades.at(-1)?.token === "\n\n") unidades.pop();

  const fragmentos: FragmentoInstitucional[] = [];
  const passo = configuracao.limiteTokens - configuracao.sobreposicaoTokens;
  for (let inicio = 0; inicio < unidades.length; inicio += passo) {
    const fatia = unidades.slice(inicio, inicio + configuracao.limiteTokens);
    if (fatia.length === 0) break;
    const texto = fatia
      .map(({ token }) => token)
      .join(" ")
      .replace(/\s+([.,;:!?])/g, "$1")
      .replace(/\s*\n\s*\n\s*/g, "\n\n")
      .trim();
    fragmentos.push({
      conteudo: texto,
      hashConteudo: hash(texto),
      posicao: fragmentos.length,
      quantidadeTokens: fatia.filter(({ token }) => token !== "\n\n").length,
      secao: fatia.find(({ secao: secaoFatia }) => secaoFatia)?.secao ?? null,
    });
    if (inicio + configuracao.limiteTokens >= unidades.length) break;
  }
  return fragmentos;
}
