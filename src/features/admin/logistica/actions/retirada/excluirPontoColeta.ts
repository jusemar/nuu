"use server";

import { db } from "@/db/connection";
import { pontosColetaTable } from "@/db/table/retirada/pontos-coleta";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function excluirPontoColeta(id: string) {
  if (!id) {
    return { success: false, error: "ID do ponto é obrigatório" };
  }

  try {
    await db
      .update(pontosColetaTable)
      .set({
        ativo: false,
        updatedAt: new Date(),
      })
      .where(eq(pontosColetaTable.id, id));

    revalidatePath("/admin/logistica/retirada-local");
    return { success: true, data: null };
  } catch (err) {
    console.error("[excluirPontoColeta]", err);
    return { success: false, error: "Erro ao desativar ponto de coleta" };
  }
}