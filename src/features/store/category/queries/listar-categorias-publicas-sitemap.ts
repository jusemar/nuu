import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable } from "@/db/schema";

/** Projeção mínima das categorias que a própria rota pública aceita. */
export async function listarCategoriasPublicasSitemap() {
  return db
    .select({
      slug: categoryTable.slug,
      updatedAt: categoryTable.updatedAt,
    })
    .from(categoryTable)
    .where(eq(categoryTable.isActive, true));
}
