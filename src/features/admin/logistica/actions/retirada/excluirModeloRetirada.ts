// TODO: Implementar
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Action: exclui modelo de retirada
import { db } from "@/db/connection";
import { modelosRetiradaTable } from "@/db/table/retirada/modelos-retirada";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function excluirModeloRetirada(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  if (!id) {
    return { success: false, error: "ID do modelo é obrigatório" };
  }

  try {
    await db
      .delete(modelosRetiradaTable)
      .where(eq(modelosRetiradaTable.id, id));
    revalidatePath("/admin/logistica/retirada-local");
    return { success: true, data: null };
  } catch (err) {
    console.error("[excluirModeloRetirada]", err);
    return { success: false, error: "Erro ao excluir modelo de retirada" };
  }
}
