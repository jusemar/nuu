import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryFaqTable } from "@/db/schema";

import { criarFaqCategoriaSchema } from "../../schemas/contratos-categoria";

const categoriaIdSchema = criarFaqCategoriaSchema.shape.categoryId;

/** A categoria faz parte obrigatória do filtro para impedir vazamento entre categorias. */
export async function consultarFaqsCategoria(categoriaId: string) {
  const id = categoriaIdSchema.parse(categoriaId);
  return db
    .select()
    .from(categoryFaqTable)
    .where(eq(categoryFaqTable.categoryId, id))
    .orderBy(asc(categoryFaqTable.orderIndex), asc(categoryFaqTable.id));
}
