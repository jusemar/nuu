"use server";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { buscarConfiguracaoVendaCruzadaAdmin as buscarConfiguracao } from "../queries/venda-cruzada/buscar-configuracao-venda-cruzada-admin";

/** Endpoint de leitura protegido para recuperar os vínculos persistidos. */
export async function buscarConfiguracaoVendaCruzadaAdmin(
  produtoPrincipalId: unknown,
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.VISUALIZAR);

  const configuracao = await buscarConfiguracao(produtoPrincipalId);
  if (!configuracao) throw new Error("Produto principal não encontrado.");
  return configuracao;
}
