"use server";

// Server Action: busca modelos de retirada
// Pode ser chamada de Client Components

import { desc } from "drizzle-orm";

import { db } from "@/db/connection";
import { modelosRetiradaTable } from "@/db/table/retirada/modelos-retirada";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function buscarModelosRetiradaAction() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const modelos = await db
    .select()
    .from(modelosRetiradaTable)
    .orderBy(desc(modelosRetiradaTable.createdAt));

  return modelos;
}
