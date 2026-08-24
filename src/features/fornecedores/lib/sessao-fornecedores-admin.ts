import "server-only";

import {
  type PermissaoAdministrativaChave,
  PERMISSOES_ADMIN,
} from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

export function exigirAcessoFornecedoresAdmin(
  permissao: PermissaoAdministrativaChave,
) {
  return exigirPermissaoAdmin(permissao);
}

/**
 * Centraliza a leitura da sessão usada pelas operações administrativas de
 * fornecedores. O painel ainda não possui RBAC; portanto, nesta etapa, uma
 * sessão válida é o requisito de segurança disponível no projeto.
 */
export async function buscarSessaoFornecedoresAdmin(
  permissao: PermissaoAdministrativaChave = PERMISSOES_ADMIN.FORNECEDORES
    .ADMINISTRAR,
) {
  try {
    await exigirPermissaoAdmin(permissao);
    const resultado = await buscarSessaoAdmin();
    return resultado.sessao;
  } catch (erro) {
    console.error("[fornecedores:sessao:erro]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return null;
  }
}

export async function possuiSessaoFornecedoresAdmin(
  permissao: PermissaoAdministrativaChave = PERMISSOES_ADMIN.FORNECEDORES
    .ADMINISTRAR,
) {
  const sessao = await buscarSessaoFornecedoresAdmin(permissao);
  return Boolean(sessao?.user);
}
