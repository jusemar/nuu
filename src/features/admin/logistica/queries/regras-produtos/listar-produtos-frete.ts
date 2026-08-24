import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function listarProdutosFrete() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  return db
    .select({
      id: productTable.id,
      nome: productTable.name,
      ativo: productTable.isActive,
    })
    .from(productTable)
    .where(eq(productTable.isActive, true))
    .orderBy(asc(productTable.name));
}
