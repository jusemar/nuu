"use server";

import { validarAcessoAdmin } from "@/features/autenticacao/actions/validar-acesso-admin";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { listarDadosAlteracaoEmMassa } from "../queries/alteracao-em-massa/listar-dados-alteracao-em-massa";

export async function recarregarListagemAlteracaoEmMassa() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.VISUALIZAR);
  const acesso = await validarAcessoAdmin();
  if (!acesso.sucesso) return { sucesso: false as const, erro: acesso.erro };
  return listarDadosAlteracaoEmMassa();
}
