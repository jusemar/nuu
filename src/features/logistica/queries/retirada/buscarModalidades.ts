// Query: lista modalidades de retirada
// Server-only

import { db } from "@/db/connection";
import { modalidadesRetiradaTable } from "@/db/table/retirada";
import { eq } from "drizzle-orm";

export async function buscarModalidades(apenasAtivas = false) {
  if (apenasAtivas) {
    return db
      .select()
      .from(modalidadesRetiradaTable)
      .where(eq(modalidadesRetiradaTable.ativo, true));
  }

  return db.select().from(modalidadesRetiradaTable);
}