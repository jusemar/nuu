// TODO: Implementar
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Action: atualiza modelo de retirada existente
import { db } from "@/db/connection";
import { modelosRetiradaTable } from "@/db/table/retirada/modelos-retirada";
import { atualizarModeloRetiradaSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function atualizarModeloRetirada(id: string, dados: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  if (!id) {
    return { success: false, error: "ID do modelo é obrigatório" };
  }

  const parse = atualizarModeloRetiradaSchema.safeParse(dados);
  if (!parse.success) {
    return {
      success: false,
      error: parse.error.issues.map((e) => e.message).join(", "),
    };
  }

  try {
    await db
      .update(modelosRetiradaTable)
      .set({
        ...parse.data,
        updatedAt: new Date(),
      })
      .where(eq(modelosRetiradaTable.id, id));

    revalidatePath("/admin/logistica/retirada-local");
    return { success: true, data: null };
  } catch (err) {
    console.error("[atualizarModeloRetirada]", err);
    return { success: false, error: "Erro ao atualizar modelo de retirada" };
  }
}
