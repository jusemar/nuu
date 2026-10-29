"use server";

import { buscarProdutosVendaCruzadaAdmin as buscarProdutos } from "../queries/venda-cruzada/buscar-produtos-venda-cruzada-admin";

/** Endpoint de leitura protegido para a busca incremental da aba administrativa. */
export async function buscarProdutosVendaCruzadaAdmin(entrada: unknown) {
  return buscarProdutos(entrada);
}
