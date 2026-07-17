"use server";

import { buscarSessaoAdmin } from "../queries/sessao/buscar-sessao-admin";

export async function validarAcessoAdmin() {
  try {
    const resultado = await buscarSessaoAdmin();

    if (resultado.motivo === "indisponivel") {
      return {
        sucesso: false,
        codigo: "SESSAO_INDISPONIVEL" as const,
        erro: "Não foi possível consultar sua sessão administrativa. Tente novamente em instantes.",
      };
    }

    if (resultado.motivo === "sessao_ausente") {
      return {
        sucesso: false,
        codigo: "SESSAO_AUSENTE" as const,
        erro: "Sessão administrativa não encontrada. Entre novamente.",
      };
    }

    if (resultado.motivo === "sessao_expirada") {
      return {
        sucesso: false,
        codigo: "SESSAO_EXPIRADA" as const,
        erro: "Sua sessão administrativa expirou. Entre novamente.",
      };
    }

    if (!resultado.autorizado) {
      return {
        sucesso: false,
        codigo: "SEM_PERMISSAO_ADMIN" as const,
        erro: "Esta conta não possui permissão para acessar o painel administrativo.",
      };
    }

    return { sucesso: true, mensagem: "Acesso administrativo autorizado." };
  } catch (erro) {
    console.error("[validarAcessoAdmin]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      codigo: "FALHA_INTERNA_AUTENTICACAO" as const,
      erro: "Não foi possível validar o acesso administrativo.",
    };
  }
}
