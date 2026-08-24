import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryFaqTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { criarFaqCategoriaSchema } from "../../schemas/contratos-categoria";

const categoriaIdSchema = criarFaqCategoriaSchema.shape.categoryId;

/** A categoria faz parte obrigatória do filtro para impedir vazamento entre categorias. */
export async function consultarFaqsCategoria(categoriaId: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.VISUALIZAR);
  const id = categoriaIdSchema.parse(categoriaId);
  return db
    .select()
    .from(categoryFaqTable)
    .where(eq(categoryFaqTable.categoryId, id))
    .orderBy(asc(categoryFaqTable.orderIndex), asc(categoryFaqTable.id));
}
