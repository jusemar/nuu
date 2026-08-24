import "server-only";

import { asc } from "drizzle-orm";

import { db } from "@/db/connection";
import { tiposLogisticosTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function listarTiposLogisticos() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  return db
    .select()
    .from(tiposLogisticosTable)
    .orderBy(asc(tiposLogisticosTable.nome));
}
