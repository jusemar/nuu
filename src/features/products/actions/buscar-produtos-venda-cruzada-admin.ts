"use server";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { buscarProdutosVendaCruzadaAdmin as buscarProdutos } from "../queries/venda-cruzada/buscar-produtos-venda-cruzada-admin";

/** Endpoint de leitura protegido para a busca incremental da aba administrativa. */
export async function buscarProdutosVendaCruzadaAdmin(entrada: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.VISUALIZAR);

  return buscarProdutos(entrada);
}
