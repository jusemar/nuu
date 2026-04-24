// Query: lista pontos de coleta
// Server-only

import { db } from "@/db/connection";
import { pontosColetaTable } from "@/db/table/retirada";
import { eq } from "drizzle-orm";

export async function buscarPontosColeta(apenasAtivos = false) {
  if (apenasAtivos) {
    return db
      .select()
      .from(pontosColetaTable)
      .where(eq(pontosColetaTable.ativo, true));
  }

  return db.select().from(pontosColetaTable);
}