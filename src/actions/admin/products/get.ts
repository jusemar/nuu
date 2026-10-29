"use server";

import { listarProdutosAdmin } from "@/features/products/queries/listagem/listar-produtos-admin";

/** Mantém o array legado do gestor; representantes recebem somente sua página autorizada. */
export async function getProducts(filtros: unknown = {}) {
  const resultado = await listarProdutosAdmin(filtros, false);
  return resultado.produtos;
}
