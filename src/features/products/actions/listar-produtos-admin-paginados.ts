"use server";

import { listarProdutosAdmin } from "../queries/listagem/listar-produtos-admin";

/** Resultados e total usam o mesmo filtro de autorização no banco. */
export async function listarProdutosAdminPaginados(entrada: unknown = {}) {
  return listarProdutosAdmin(entrada);
}
