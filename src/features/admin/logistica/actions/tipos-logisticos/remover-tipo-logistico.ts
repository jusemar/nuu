"use server";

import { db } from "@/db/connection";
import { tiposLogisticosTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function removerTipoLogistico(tipoLogisticoId: string) {
  if (!tipoLogisticoId) return { sucesso: false as const, erro: "ID do tipo logístico é obrigatório" };
  try {
    const [registro] = await db
      .delete(tiposLogisticosTable)
      .where(eq(tiposLogisticosTable.id, tipoLogisticoId))
      .returning({ id: tiposLogisticosTable.id });
    if (!registro) return { sucesso: false as const, erro: "Tipo logístico não encontrado" };
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[removerTipoLogistico]", erro);
    return { sucesso: false as const, erro: "Falha ao remover tipo logístico" };
  }
}

