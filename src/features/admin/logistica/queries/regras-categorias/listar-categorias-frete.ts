import "server-only";

import { db } from "@/db/connection";
import { categoryTable } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function listarCategoriasFrete() {
  return db
    .select({ id: categoryTable.id, nome: categoryTable.name, ativo: categoryTable.isActive })
    .from(categoryTable)
    .orderBy(asc(categoryTable.name));
}

