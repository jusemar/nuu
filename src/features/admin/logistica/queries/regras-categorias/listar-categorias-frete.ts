import "server-only";

import { asc } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function listarCategoriasFrete() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  return db
    .select({
      id: categoryTable.id,
      nome: categoryTable.name,
      ativo: categoryTable.isActive,
    })
    .from(categoryTable)
    .orderBy(asc(categoryTable.name));
}
