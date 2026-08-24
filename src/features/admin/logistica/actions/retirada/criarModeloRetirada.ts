// TODO: Implementar
"use server";

import { revalidatePath } from "next/cache";

// Action: cria novo modelo de retirada
// Retorno padronizado: { success, data, error }
import { db } from "@/db/connection";
import { modelosRetiradaTable } from "@/db/table/retirada/modelos-retirada";
import { criarModeloRetiradaSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function criarModeloRetirada(dados: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const parse = criarModeloRetiradaSchema.safeParse(dados);
  if (!parse.success) {
    return {
      success: false,
      error: parse.error.issues.map((e) => e.message).join(", "),
    };
  }

  try {
    await db.insert(modelosRetiradaTable).values({
      ...parse.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/admin/logistica/retirada-local");
    return { success: true, data: null };
  } catch (err) {
    console.error("[criarModeloRetirada]", err);
    return { success: false, error: "Erro ao criar modelo de retirada" };
  }
}
