"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { categoryFaqTable, categoryTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { validarEscopoOrdemFaqs } from "../lib/faqs-categoria";
import { consultarFaqsCategoria } from "../queries/faqs/listar-faqs-categoria";
import {
  alterarStatusFaqCategoriaSchema,
  atualizarFaqCategoriaSchema,
  criarFaqCategoriaSchema,
  excluirFaqCategoriaSchema,
  reordenarFaqsCategoriaSchema,
} from "../schemas/contratos-categoria";

const categoriaIdSchema = criarFaqCategoriaSchema.shape.categoryId;
const faqIdSchema = excluirFaqCategoriaSchema.shape.id;

function revalidarCategoria(categoriaId: string) {
  revalidatePath(`/admin/categories/${categoriaId}`);
}

/** Adaptador de leitura necessário para o Client Component chamar a query server-only. */
export async function listarFaqsCategoria(categoriaId: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.VISUALIZAR);
  return consultarFaqsCategoria(categoriaId);
}

export async function criarFaqCategoria(dados: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR);
  const entrada = criarFaqCategoriaSchema.parse(dados);
  const [categoria] = await db
    .select({ id: categoryTable.id })
    .from(categoryTable)
    .where(eq(categoryTable.id, entrada.categoryId))
    .limit(1);
  if (!categoria) throw new Error("Categoria não encontrada.");

  const [faq] = await db.insert(categoryFaqTable).values(entrada).returning();
  if (!faq) throw new Error("Não foi possível criar a pergunta frequente.");
  revalidarCategoria(entrada.categoryId);
  return faq;
}

export async function atualizarFaqCategoria(
  categoriaId: string,
  faqId: string,
  dados: unknown,
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR);
  const idCategoria = categoriaIdSchema.parse(categoriaId);
  const idFaq = faqIdSchema.parse(faqId);
  const entrada = atualizarFaqCategoriaSchema.parse(dados);
  if (Object.keys(entrada).length === 0)
    throw new Error("Nenhuma alteração informada.");
  const [faq] = await db
    .update(categoryFaqTable)
    .set({ ...entrada, updatedAt: new Date() })
    .where(
      and(
        eq(categoryFaqTable.id, idFaq),
        eq(categoryFaqTable.categoryId, idCategoria),
      ),
    )
    .returning();
  if (!faq)
    throw new Error("Pergunta frequente não encontrada nesta categoria.");
  revalidarCategoria(idCategoria);
  return faq;
}

export async function alterarStatusFaqCategoria(
  categoriaId: string,
  faqId: string,
  isActive: boolean,
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR);
  const entrada = alterarStatusFaqCategoriaSchema.parse({ isActive });
  return atualizarFaqCategoria(categoriaId, faqId, entrada);
}

export async function excluirFaqCategoria(categoriaId: string, faqId: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR);
  const idCategoria = categoriaIdSchema.parse(categoriaId);
  const idFaq = faqIdSchema.parse(faqId);
  const [faq] = await db
    .delete(categoryFaqTable)
    .where(
      and(
        eq(categoryFaqTable.id, idFaq),
        eq(categoryFaqTable.categoryId, idCategoria),
      ),
    )
    .returning({ id: categoryFaqTable.id });
  if (!faq)
    throw new Error("Pergunta frequente não encontrada nesta categoria.");
  revalidarCategoria(idCategoria);
  return faq;
}

export async function reordenarFaqsCategoria(
  categoriaId: string,
  itens: unknown,
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR);
  const idCategoria = categoriaIdSchema.parse(categoriaId);
  const ordem = reordenarFaqsCategoriaSchema.parse(itens);
  const ids = ordem.map((item) => item.id);
  const existentes = await db
    .select({ id: categoryFaqTable.id })
    .from(categoryFaqTable)
    .where(eq(categoryFaqTable.categoryId, idCategoria));
  validarEscopoOrdemFaqs(
    existentes.map((faq) => faq.id),
    ordem,
  );

  // Um único UPDATE evita ordem parcialmente persistida em caso de falha.
  const casos = ordem.map(
    (item) =>
      sql`when ${categoryFaqTable.id} = ${item.id} then ${item.orderIndex}`,
  );
  await db
    .update(categoryFaqTable)
    .set({
      orderIndex: sql`case ${sql.join(casos, sql` `)} else ${categoryFaqTable.orderIndex} end`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(categoryFaqTable.categoryId, idCategoria),
        inArray(categoryFaqTable.id, ids),
      ),
    );
  revalidarCategoria(idCategoria);
  return ordem;
}
