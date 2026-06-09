import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { importacoesFornecedorTable } from "@/db/schema";

export async function listarImportacoesFornecedor(fornecedorId: string) {
  return db
    .select()
    .from(importacoesFornecedorTable)
    .where(eq(importacoesFornecedorTable.fornecedorId, fornecedorId))
    .orderBy(desc(importacoesFornecedorTable.criadoEm));
}
