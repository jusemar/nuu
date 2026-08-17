import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable } from "@/db/schema";

import type { CategoriaFidelidade } from "../types/programa-fidelidade.types";

/** Leitura isolada: a demonstração nunca altera o cadastro das categorias. */
export async function listarCategoriasFidelidade(): Promise<
  CategoriaFidelidade[]
> {
  const categorias = await db
    .select({ id: categoryTable.id, nome: categoryTable.name })
    .from(categoryTable)
    .where(eq(categoryTable.isActive, true))
    .orderBy(asc(categoryTable.name));

  // Métricas auxiliares são demonstrações visuais até a integração do módulo.
  return categorias.map((categoria, indice) => ({
    ...categoria,
    grupo: "Categoria da loja",
    produtos: 24 + ((indice * 37) % 180),
    ativa: true,
    pontosUltimos30Dias: 5320 + ((indice * 7910) % 145000),
  }));
}
