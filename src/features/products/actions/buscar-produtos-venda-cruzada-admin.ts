"use server";

import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

import { buscarProdutosVendaCruzadaAdmin as buscarProdutos } from "../queries/venda-cruzada/buscar-produtos-venda-cruzada-admin";

/** Endpoint de leitura protegido para a busca incremental da aba administrativa. */
export async function buscarProdutosVendaCruzadaAdmin(entrada: unknown) {
  const sessao = await buscarSessaoAdmin();
  if (!sessao.autorizado) {
    throw new Error("Sessão de administrador inválida ou expirada.");
  }

  return buscarProdutos(entrada);
}
