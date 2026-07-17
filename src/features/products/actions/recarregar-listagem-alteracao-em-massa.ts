"use server";

import { validarAcessoAdmin } from "@/features/autenticacao/actions/validar-acesso-admin";

import { listarDadosAlteracaoEmMassa } from "../queries/alteracao-em-massa/listar-dados-alteracao-em-massa";

export async function recarregarListagemAlteracaoEmMassa() {
  const acesso = await validarAcessoAdmin();
  if (!acesso.sucesso) return { sucesso: false as const, erro: acesso.erro };
  return listarDadosAlteracaoEmMassa();
}
