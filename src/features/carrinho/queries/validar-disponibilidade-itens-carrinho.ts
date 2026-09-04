"use server";

import { z } from "zod";

import { listarDiagnosticosLogisticosProdutos } from "@/features/logistica/queries/listar-diagnosticos-logisticos-produtos";

const entradaSchema = z.array(z.string().uuid()).max(100);

export type ResultadoDisponibilidadeItensCarrinho =
  | {
      sucesso: true;
      itens: Array<{
        produtoId: string;
        disponivel: boolean;
        mensagem: string | null;
      }>;
    }
  | { sucesso: false; mensagem: string };

/**
 * Revalida o estado persistido ao abrir o carrinho. O cliente envia apenas
 * identificadores; publicação e logística são sempre decididas no servidor.
 */
export async function validarDisponibilidadeItensCarrinho(
  produtoIds: string[],
): Promise<ResultadoDisponibilidadeItensCarrinho> {
  const entrada = entradaSchema.safeParse([...new Set(produtoIds)]);
  if (!entrada.success) {
    return { sucesso: false, mensagem: "Não foi possível validar o carrinho." };
  }

  try {
    const produtos = await listarDiagnosticosLogisticosProdutos(entrada.data);
    const produtosPorId = new Map(
      produtos.map((produto) => [produto.id, produto]),
    );

    return {
      sucesso: true,
      itens: entrada.data.map((produtoId) => {
        const produto = produtosPorId.get(produtoId);
        const disponivel = Boolean(
          produto &&
            produto.ativo &&
            produto.status === "published" &&
            produto.diagnostico.valido,
        );
        return {
          produtoId,
          disponivel,
          mensagem: disponivel
            ? null
            : "Este produto está temporariamente indisponível.",
        };
      }),
    };
  } catch (error) {
    console.error("[carrinho:validar-disponibilidade:erro]", {
      tipo:
        error instanceof Error ? error.constructor.name : "ErroDesconhecido",
    });
    return {
      sucesso: false,
      mensagem:
        "Não foi possível validar o carrinho agora. Tente novamente em alguns instantes.",
    };
  }
}
