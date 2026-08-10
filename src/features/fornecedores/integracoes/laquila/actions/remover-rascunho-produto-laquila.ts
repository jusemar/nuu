"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/connection";
import { produtoRascunhosTable } from "@/db/schema";
import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";

const removerRascunhoProdutoLaquilaSchema = z.object({
  rascunhoId: z.uuid(),
});

export async function removerRascunhoProdutoLaquila(entrada: unknown) {
  const validacao = removerRascunhoProdutoLaquilaSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro: "Rascunho inválido para remoção.",
    };
  }

  const sessaoValida = await possuiSessaoFornecedoresAdmin();

  if (!sessaoValida) {
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
          eq(produtoRascunhosTable.origemProvedor, PROVEDOR_INTEGRACAO_LAQUILA),
        ),
      );

    revalidatePath("/admin/fornecedores/integracoes/laquila/vinculos");
    revalidatePath("/admin/fornecedores/integracoes/laquila/conciliacao");

    return {
      sucesso: true,
      mensagem: "Rascunho removido.",
    };
  } catch (erro) {
    console.error("[removerRascunhoProdutoLaquila]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro: "Não foi possível remover o rascunho.",
    };
  }
}
