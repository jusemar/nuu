import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  categoryTable,
  modelosRetiradaTable,
  politicasEntregaPropriaTable,
  precosPoliticasEntregaPropriaTable,
  productTable,
} from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function listarPoliticasEntregaPropriaAdmin() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const [politicas, precos, modelosRetirada, categorias, produtos] =
    await Promise.all([
      db.select().from(politicasEntregaPropriaTable),
      db.select().from(precosPoliticasEntregaPropriaTable),
      db
        .select({
          id: modelosRetiradaTable.id,
          nome: modelosRetiradaTable.nome,
        })
        .from(modelosRetiradaTable)
        .where(eq(modelosRetiradaTable.ativo, true))
        .orderBy(asc(modelosRetiradaTable.nome)),
      db
        .select({ id: categoryTable.id, nome: categoryTable.name })
        .from(categoryTable)
        .where(eq(categoryTable.isActive, true))
        .orderBy(asc(categoryTable.name)),
      db
        .select({
          id: productTable.id,
          nome: productTable.name,
          sku: productTable.sku,
        })
        .from(productTable)
        .where(eq(productTable.status, "published"))
        .orderBy(asc(productTable.name)),
    ]);
  return {
    politicas: politicas.map((politica) => ({
      ...politica,
      precos: precos.filter((preco) => preco.politicaId === politica.id),
    })),
    modelosRetirada,
    categorias,
    produtos,
  };
}
