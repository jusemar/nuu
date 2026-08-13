"use server";

import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

import { buscarConfiguracaoVendaCruzadaAdmin as buscarConfiguracao } from "../queries/venda-cruzada/buscar-configuracao-venda-cruzada-admin";

/** Endpoint de leitura protegido para recuperar os vínculos persistidos. */
export async function buscarConfiguracaoVendaCruzadaAdmin(
  produtoPrincipalId: unknown,
) {
  const sessao = await buscarSessaoAdmin();
  if (!sessao.autorizado) {
    throw new Error("Sessão de administrador inválida ou expirada.");
  }

  const configuracao = await buscarConfiguracao(produtoPrincipalId);
  if (!configuracao) throw new Error("Produto principal não encontrado.");
  return configuracao;
}
