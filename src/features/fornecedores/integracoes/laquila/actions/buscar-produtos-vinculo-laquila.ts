"use server";

import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { buscarProdutosParaVinculoFornecedor } from "@/features/fornecedores/queries";

type ResultadoBuscarProdutosVinculoLaquila = {
  sucesso: boolean;
  erro?: string;
  produtos?: Array<{
    id: string;
    nome: string;
    sku: string;
    categoria?: string | null;
    preco?: string | null;
  }>;
};

export async function buscarProdutosVinculoLaquila(
  entrada: unknown,
): Promise<ResultadoBuscarProdutosVinculoLaquila> {
  const sessaoValida = await possuiSessaoFornecedoresAdmin();

  if (!sessaoValida) {
    return {
      sucesso: false,
      erro: "Sua sessão não está ativa. Entre novamente para buscar produtos.",
    };
  }

  try {
    const produtos = await buscarProdutosParaVinculoFornecedor(entrada);

    return {
      sucesso: true,
      produtos: produtos.map((produto) => ({
        id: produto.id,
        nome: produto.nome,
        sku: produto.sku,
        categoria: produto.categoria,
        preco: produto.preco,
      })),
    };
  } catch (erro) {
    console.error("[buscarProdutosVinculoLaquila]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro: "Não foi possível buscar produtos reais da loja.",
    };
  }
}
