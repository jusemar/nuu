import "server-only";

import { and, eq, ilike, or } from "drizzle-orm";

import { db } from "../../../db/connection";
import { categoryTable } from "../../../db/schema";
import { buscarCategoriasPromocaoAdminSchema } from "../schemas";
import type { CategoriaPromocaoAdmin } from "../types";

export async function buscarCategoriasPromocaoAdmin(
  entrada: unknown,
): Promise<CategoriaPromocaoAdmin[]> {
  const filtros = buscarCategoriasPromocaoAdminSchema.parse(entrada);

  const linhas = await db
    .select({
      id: categoryTable.id,
      nome: categoryTable.name,
      slug: categoryTable.slug,
    })
    .from(categoryTable)
    .where(
      and(
        eq(categoryTable.isActive, true),
        or(
          ilike(categoryTable.name, `%${filtros.busca}%`),
          ilike(categoryTable.slug, `%${filtros.busca}%`),
        ),
      ),
    )
    .limit(filtros.limite);

  return linhas;
}
