"use server"

// Server Action: busca modelos de retirada
// Pode ser chamada de Client Components

import { db } from "@/db/connection";
import { modelosRetiradaTable } from "@/db/table/retirada/modelos-retirada";
import { desc } from "drizzle-orm";

export async function buscarModelosRetiradaAction() {
  const modelos = await db
    .select()
    .from(modelosRetiradaTable)
    .orderBy(desc(modelosRetiradaTable.createdAt));
  
  return modelos;
}