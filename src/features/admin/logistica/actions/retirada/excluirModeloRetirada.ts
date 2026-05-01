// TODO: Implementar
"use server";

// Action: exclui modelo de retirada

import { db } from "@/db/connection";
import { modelosRetiradaTable } from "@/db/table/retirada/modelos-retirada";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function excluirModeloRetirada(id: string) {
  if (!id) {
    return { success: false, error: "ID do modelo é obrigatório" };
  }

  try {
    await db.delete(modelosRetiradaTable).where(eq(modelosRetiradaTable.id, id));
    revalidatePath("/admin/logistica/retirada-local");
    return { success: true, data: null };
  } catch (err) {
    console.error("[excluirModeloRetirada]", err);
    return { success: false, error: "Erro ao excluir modelo de retirada" };
  }
}