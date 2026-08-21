import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryFaqTable, categoryTable, productTable } from "@/db/schema";

import { categoriaPodeSerIndexada } from "../lib/politica-indexacao-categoria";
import { condicaoProdutoPublicoCategoria } from "./condicao-produto-publico-categoria";

/** Projeção mínima das categorias que a própria rota pública aceita. */
export async function listarCategoriasPublicasSitemap() {
  const [categoriasAtivas, categoriasComProdutos, faqsAtivas] =
    await Promise.all([
      db
        .select({
          id: categoryTable.id,
          parentId: categoryTable.parentId,
          slug: categoryTable.slug,
          description: categoryTable.description,
          descriptionBottom: categoryTable.descriptionBottom,
          updatedAt: categoryTable.updatedAt,
        })
        .from(categoryTable)
        .where(eq(categoryTable.isActive, true)),
      db
        .select({ categoryId: productTable.categoryId })
        .from(productTable)
        .where(condicaoProdutoPublicoCategoria()),
      db
        .select({
          categoryId: categoryFaqTable.categoryId,
          question: categoryFaqTable.question,
          answer: categoryFaqTable.answer,
        })
        .from(categoryFaqTable)
        .where(eq(categoryFaqTable.isActive, true)),
    ]);

  const categoriaPorId = new Map(
    categoriasAtivas.map((categoria) => [categoria.id, categoria]),
  );
  const categoriasComProdutoNaArvore = new Set<string>();

  for (const produto of categoriasComProdutos) {
    let categoriaId: string | null = produto.categoryId;
    const visitadas = new Set<string>();

    while (categoriaId && !visitadas.has(categoriaId)) {
      visitadas.add(categoriaId);
      categoriasComProdutoNaArvore.add(categoriaId);
      categoriaId = categoriaPorId.get(categoriaId)?.parentId ?? null;
    }
  }

  const faqsPorCategoria = new Map<
    string,
    Array<{ question: string; answer: string }>
  >();

  for (const faq of faqsAtivas) {
    if (!faq.categoryId) continue;
    const faqs = faqsPorCategoria.get(faq.categoryId) ?? [];
    faqs.push({ question: faq.question, answer: faq.answer });
    faqsPorCategoria.set(faq.categoryId, faqs);
  }

  return categoriasAtivas
    .filter((categoria) =>
      categoriaPodeSerIndexada({
        description: categoria.description,
        descriptionBottom: categoria.descriptionBottom,
        faqs: faqsPorCategoria.get(categoria.id) ?? [],
        temProdutoPublico: categoriasComProdutoNaArvore.has(categoria.id),
      }),
    )
    .map(({ slug, updatedAt }) => ({ slug, updatedAt }));
}
