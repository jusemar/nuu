"use server";

import { db } from "@/db/connection";
import { pontosColetaTable } from "@/db/table/retirada/pontos-coleta";
import { atualizarPontoColetaSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function atualizarPontoColeta(id: string, dados: unknown) {
  if (!id) {
    return { success: false, error: "ID do ponto é obrigatório" };
  }

  const parse = atualizarPontoColetaSchema.safeParse(dados);
  if (!parse.success) {
    return {
      success: false,
      error: parse.error.issues.map((e) => e.message).join(", "),
    };
  }

  try {
    await db
      .update(pontosColetaTable)
      .set({
        ...parse.data,
        updatedAt: new Date(),
      })
      .where(eq(pontosColetaTable.id, id));

    revalidatePath("/admin/logistica/retirada-local");
    return { success: true, data: null };
  } catch (err) {
    console.error("[atualizarPontoColeta]", err);
    return { success: false, error: "Erro ao atualizar ponto de coleta" };
  }
}