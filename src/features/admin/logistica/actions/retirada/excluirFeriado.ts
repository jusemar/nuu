"use server";

import { db } from "@/db/connection";
import { feriadosTable } from "@/db/table/retirada/feriados";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function excluirFeriado(id: string) {
  if (!id) {
    return { success: false, error: "ID do feriado é obrigatório" };
  }

  try {
    await db.delete(feriadosTable).where(eq(feriadosTable.id, id));

    revalidatePath("/admin/logistica/retirada-local");
    return { success: true, data: null };
  } catch (err) {
    console.error("[excluirFeriado]", err);
    return { success: false, error: "Erro ao excluir feriado" };
  }
}