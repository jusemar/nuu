"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/connection";
import { produtoRascunhosTable } from "@/db/schema";
import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";

const removerRascunhoProdutoImportacaoFornecedorSchema = z.object({
  rascunhoId: z.uuid(),
  importacaoId: z.uuid(),
});

export async function removerRascunhoProdutoImportacaoFornecedor(
  entrada: unknown,
) {
  const validacao =
    removerRascunhoProdutoImportacaoFornecedorSchema.safeParse(entrada);

  if (!validacao.success) {
    return { sucesso: false, erro: "Rascunho inválido para remoção." };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão não está ativa. Entre novamente para remover o rascunho.",
    };
  }

  try {
    await db
      .delete(produtoRascunhosTable)
      .where(
        and(
          eq(produtoRascunhosTable.id, validacao.data.rascunhoId),
          eq(produtoRascunhosTable.origemTipo, "fornecedor_excel"),
          eq(produtoRascunhosTable.origemProvedor, "arquivo_excel"),
          sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${validacao.data.importacaoId}`,
        ),
      );

    revalidatePath(
      `/admin/fornecedores/importacoes/${validacao.data.importacaoId}`,
    );

    return { sucesso: true, mensagem: "Rascunho removido." };
  } catch (erro) {
    console.error("[removerRascunhoProdutoImportacaoFornecedor]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return { sucesso: false, erro: "Não foi possível remover o rascunho." };
  }
}
