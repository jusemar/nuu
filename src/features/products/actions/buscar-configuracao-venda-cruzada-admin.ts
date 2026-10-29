"use server";

import { buscarConfiguracaoVendaCruzadaAdmin as buscarConfiguracao } from "../queries/venda-cruzada/buscar-configuracao-venda-cruzada-admin";

/** Endpoint de leitura protegido para recuperar os vínculos persistidos. */
export async function buscarConfiguracaoVendaCruzadaAdmin(
  produtoPrincipalId: unknown,
) {
  const configuracao = await buscarConfiguracao(produtoPrincipalId);
  if (!configuracao) throw new Error("Produto principal não encontrado.");
  return configuracao;
}
