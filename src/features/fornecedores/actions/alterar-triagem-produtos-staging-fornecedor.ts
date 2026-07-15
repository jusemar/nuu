"use server";

import { revalidatePath } from "next/cache";

import { alterarTriagemProdutosStagingFornecedorSchema } from "../schemas/fornecedores.schema";
import { alterarTriagemProdutosStagingFornecedor } from "../services/alterar-triagem-produtos-staging-fornecedor.service";

type EntradaAlterarTriagemProdutosStagingFornecedor = {
  importacaoId: string;
  stagingIds: string[];
  acao: "ignorar" | "restaurar";
};

export async function alterarTriagemProdutosStagingFornecedorAction(
  entrada: EntradaAlterarTriagemProdutosStagingFornecedor,
) {
  const validacao =
    alterarTriagemProdutosStagingFornecedorSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro: "Não foi possível validar os itens selecionados.",
    };
  }

  try {
    const resultado = await alterarTriagemProdutosStagingFornecedor(
      validacao.data,
    );

    revalidatePath(`/admin/fornecedores/importacoes/${resultado.importacaoId}`);

    return {
      sucesso: true,
      mensagem:
        resultado.acao === "ignorar"
          ? "Itens ignorados com sucesso."
          : "Itens restaurados com sucesso.",
    };
  } catch (erro) {
    console.error("[alterarTriagemProdutosStagingFornecedorAction]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro: "Não foi possível atualizar a triagem. Tente novamente.",
    };
  }
}
