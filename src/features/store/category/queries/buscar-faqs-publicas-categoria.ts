import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/connection";
import { categoryFaqTable } from "@/db/schema";

export type FaqPublicaCategoria = {
  id: string;
  pergunta: string;
  resposta: string;
};

/** Busca somente as FAQs públicas vinculadas exatamente à categoria informada. */
export const buscarFaqsPublicasCategoria = cache(async (categoriaId: string) =>
  db
    .select({
      id: categoryFaqTable.id,
      pergunta: categoryFaqTable.question,
      resposta: categoryFaqTable.answer,
    })
    .from(categoryFaqTable)
    .where(
      and(
        eq(categoryFaqTable.categoryId, categoriaId),
        eq(categoryFaqTable.isActive, true),
      ),
    )
    .orderBy(asc(categoryFaqTable.orderIndex), asc(categoryFaqTable.id)),
);
