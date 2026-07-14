import "server-only";

import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

/**
 * Centraliza a leitura da sessão usada pelas operações administrativas de
 * fornecedores. O painel ainda não possui RBAC; portanto, nesta etapa, uma
 * sessão válida é o requisito de segurança disponível no projeto.
 */
export async function buscarSessaoFornecedoresAdmin() {
  try {
    const resultado = await buscarSessaoAdmin();
    return resultado.autorizado ? resultado.sessao : null;
  } catch (erro) {
    console.error("[fornecedores:sessao:erro]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return null;
  }
}

export async function possuiSessaoFornecedoresAdmin() {
  const sessao = await buscarSessaoFornecedoresAdmin();
  return Boolean(sessao?.user);
}
