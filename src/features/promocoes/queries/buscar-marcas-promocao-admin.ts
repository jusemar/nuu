import "server-only";

import { and, eq, ilike, or } from "drizzle-orm";

import { db } from "../../../db/connection";
import { marcaTable } from "../../../db/schema";
import { buscarMarcasPromocaoAdminSchema } from "../schemas";
import type { MarcaPromocaoAdmin } from "../types";

export async function buscarMarcasPromocaoAdmin(
  entrada: unknown,
): Promise<MarcaPromocaoAdmin[]> {
  const filtros = buscarMarcasPromocaoAdminSchema.parse(entrada);

  const linhas = await db
    .select({
      id: marcaTable.id,
      nome: marcaTable.nome,
      slug: marcaTable.slug,
      logoUrl: marcaTable.logoUrl,
    })
    .from(marcaTable)
    .where(
      and(
        eq(marcaTable.ativo, true),
        or(
          ilike(marcaTable.nome, `%${filtros.busca}%`),
          ilike(marcaTable.slug, `%${filtros.busca}%`),
        ),
      ),
    )
    .limit(filtros.limite);

  return linhas;
}
