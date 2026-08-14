import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable } from "@/db/schema";

import type { CategoriaFidelidade } from "../types/programa-fidelidade.types";

/** Leitura isolada: a demonstração nunca altera o cadastro das categorias. */
export async function listarCategoriasFidelidade(): Promise<
  CategoriaFidelidade[]
> {
  return db
    .select({ id: categoryTable.id, nome: categoryTable.name })
    .from(categoryTable)
    .where(eq(categoryTable.isActive, true))
    .orderBy(asc(categoryTable.name));
}
