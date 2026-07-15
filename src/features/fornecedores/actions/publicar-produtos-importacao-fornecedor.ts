"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/connection";
import { produtoRascunhosTable } from "@/db/schema";
import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { publicarProdutoRascunhoFornecedor } from "@/features/fornecedores/services/publicar-produto-rascunho-fornecedor.service";

const publicarProdutosImportacaoFornecedorSchema = z.object({
  rascunhoIds: z.array(z.uuid()).min(1).max(50),
});

type ItemPublicadoImportacaoFornecedor = {
  rascunhoId: string;
  produtoId: string;
  varianteTecnicaId: string | null;
  slug: string;
  sku: string;
};

export async function publicarProdutosImportacaoFornecedor(
  importacaoId: string,
  entrada: unknown,
) {
  const idValidado = z.uuid().safeParse(importacaoId);
  const validacao =
    publicarProdutosImportacaoFornecedorSchema.safeParse(entrada);

  if (!idValidado.success || !validacao.success) {
    return {
      sucesso: false,
      erro: "Selecione ao menos um rascunho válido para publicar.",
      publicados: [] as ItemPublicadoImportacaoFornecedor[],
    };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão expirou. Entre novamente para publicar produtos.",
      publicados: [] as ItemPublicadoImportacaoFornecedor[],
    };
  }

  const idsUnicos = Array.from(new Set(validacao.data.rascunhoIds));
  const rascunhosPermitidos = await db
    .select({ id: produtoRascunhosTable.id })
    .from(produtoRascunhosTable)
    .where(
      and(
        inArray(produtoRascunhosTable.id, idsUnicos),
        eq(produtoRascunhosTable.origemTipo, "fornecedor_excel"),
        eq(produtoRascunhosTable.origemProvedor, "arquivo_excel"),
        eq(produtoRascunhosTable.status, "pronto_para_publicar"),
        sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${idValidado.data}`,
      ),
    );

  if (rascunhosPermitidos.length !== idsUnicos.length) {
    return {
      sucesso: false,
      erro: "Um ou mais rascunhos não pertencem à importação ou ainda possuem pendências.",
      publicados: [] as ItemPublicadoImportacaoFornecedor[],
    };
  }

  const publicados: ItemPublicadoImportacaoFornecedor[] = [];
  const erros: Array<{ rascunhoId: string; erro: string }> = [];

  for (const rascunhoId of idsUnicos) {
    try {
      publicados.push(
        await publicarProdutoRascunhoFornecedor(rascunhoId, {
          origemTipo: "fornecedor_excel",
          origemProvedor: "arquivo_excel",
          importacaoId: idValidado.data,
          nomeOrigem: "da importação",
        }),
      );
    } catch (erro) {
      erros.push({
        rascunhoId,
        erro: erro instanceof Error ? erro.message : "Erro desconhecido.",
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/fornecedores/importacoes/${idValidado.data}`);
  revalidatePath(
    `/admin/fornecedores/importacoes/${idValidado.data}/publicacao`,
  );
  revalidatePath("/");

  if (publicados.length === 0) {
    return {
      sucesso: false,
      erro:
        erros[0]?.erro ?? "Não foi possível publicar os produtos selecionados.",
      publicados,
      erros,
    };
  }

  return {
    sucesso: erros.length === 0,
    mensagem:
      erros.length === 0
        ? `${publicados.length} produto${publicados.length === 1 ? " publicado" : "s publicados"} com sucesso.`
        : `${publicados.length} produto${publicados.length === 1 ? " publicado" : "s publicados"}; ${erros.length} não puderam ser publicados.`,
    erro:
      erros.length > 0
        ? "Alguns produtos possuem pendências. Revise os itens não publicados."
        : undefined,
    publicados,
    erros,
  };
}
