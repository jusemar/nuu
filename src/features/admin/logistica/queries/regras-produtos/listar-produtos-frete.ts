import "server-only";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function listarProdutosFrete() {
  return db
    .select({ id: productTable.id, nome: productTable.name, ativo: productTable.isActive })
    .from(productTable)
    .where(eq(productTable.isActive, true))
    .orderBy(asc(productTable.name));
}

