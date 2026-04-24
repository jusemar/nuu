// Query: lista todos os feriados cadastrados
// Server-only

import { db } from "@/db/connection";
import { feriadosTable } from "@/db/table/retirada";
import { asc } from "drizzle-orm";

export async function buscarFeriados() {
  return db.select().from(feriadosTable).orderBy(asc(feriadosTable.data));
}