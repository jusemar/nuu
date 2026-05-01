// TODO: Implementar
// Query: busca todos os modelos de retirada
// Server-only — chamada em Server Components

import { db } from "@/db/connection";
import { modelosRetiradaTable } from "@/db/table/retirada/modelos-retirada";
import { desc } from "drizzle-orm";

export async function buscarModelosRetirada() {
  return db.select().from(modelosRetiradaTable).orderBy(desc(modelosRetiradaTable.createdAt));
}