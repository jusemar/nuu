"use server";
import { z } from "zod";

import { buscarAtendimentoProdutoJaaaGestor } from "../../queries/jaaa/buscar-atendimento-produto-gestor";
import {
  listarIdentidadesJaaaGestor,
  listarProdutosAtendimentoJaaaGestor,
} from "../../queries/jaaa/listar-gestao-jaaa";
import {
  resolverDestinoProdutoJaaa,
  resolverMeuDestinoJaaa,
} from "../../queries/jaaa/resolver-destinos-jaaa";
export async function consultarIdentidadesJaaa(entrada: unknown) {
  return listarIdentidadesJaaaGestor(entrada);
}
export async function consultarProdutosAtendimentoJaaa(entrada: unknown) {
  return listarProdutosAtendimentoJaaaGestor(entrada);
}
export async function consultarConfiguracaoAtendimentoJaaa(entrada: unknown) {
  return buscarAtendimentoProdutoJaaaGestor(entrada);
}
/** Nenhum ID fornecido pelo cliente pode alterar o titular desta consulta. */
export async function consultarMeuJaaa(entrada: unknown = {}) {
  z.object({}).strict().parse(entrada);
  return {
    destino: (await resolverMeuDestinoJaaa())
      ? "/api/jaaa/representante"
      : null,
  };
}
export async function consultarAtendimentoPublicoJaaa(entrada: unknown) {
  const { produtoId } = z
    .object({ produtoId: z.uuid() })
    .strict()
    .parse(entrada);
  try {
    return {
      destino: (await resolverDestinoProdutoJaaa(produtoId))
        ? `/api/jaaa/produto/${produtoId}`
        : null,
    };
  } catch {
    return { destino: null };
  }
}
