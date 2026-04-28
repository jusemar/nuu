// Query: busca ponto de coleta específico por ID
// Server-only

import { db } from "@/db/connection";
import { pontosColetaTable } from "@/db/table/retirada";
import { eq } from "drizzle-orm";

export async function buscarPontoColetaPorId(id: string) {
  const [ponto] = await db
    .select()
    .from(pontosColetaTable)
    .where(eq(pontosColetaTable.id, id))
    .limit(1);

  return ponto ?? null;
}