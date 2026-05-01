// TODO: Implementar
"use server";

// Action: atualiza modelo de retirada existente

import { db } from "@/db/connection";
import { modelosRetiradaTable } from "@/db/table/retirada/modelos-retirada";
import { atualizarModeloRetiradaSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function atualizarModeloRetirada(id: string, dados: unknown) {
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