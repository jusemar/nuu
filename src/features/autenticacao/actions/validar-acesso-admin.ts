"use server";

import { buscarSessaoAdmin } from "../queries/sessao/buscar-sessao-admin";

export async function validarAcessoAdmin() {
  try {
    const resultado = await buscarSessaoAdmin();

    if (resultado.motivo === "indisponivel") {
      return {
        sucesso: false,
        erro: "Sessão administrativa indisponível. Tente novamente em instantes.",
      };
    }

    if (!resultado.sessao?.user) {
      return { sucesso: false, erro: "Sessão administrativa não encontrada." };
    }

    if (!resultado.autorizado) {
      return {
        sucesso: false,
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
      erro: "Não foi possível validar o acesso administrativo.",
    };
  }
}
