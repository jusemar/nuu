// TODO: Implementar
// Query: busca todos os modelos de retirada
// Server-only — chamada em Server Components

import "server-only";

import { desc } from "drizzle-orm";

import { db } from "@/db/connection";
import { modelosRetiradaTable } from "@/db/table/retirada/modelos-retirada";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function buscarModelosRetirada() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  return db
    .select()
    .from(modelosRetiradaTable)
    .orderBy(desc(modelosRetiradaTable.createdAt));
}
