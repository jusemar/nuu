import "server-only";

import { db } from "@/db/connection";
import { tiposLogisticosTable } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function listarTiposLogisticos() {
  return db
    .select()
    .from(tiposLogisticosTable)
    .orderBy(asc(tiposLogisticosTable.nome));
}

