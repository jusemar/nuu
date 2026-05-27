"use server";

import { db } from "@/db/connection";
import { regrasTiposLogisticosFreteTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function removerRegraTipoLogisticoFrete(regraTipoLogisticoFreteId: string) {
  if (!regraTipoLogisticoFreteId) return { sucesso: false as const, erro: "ID da regra é obrigatório" };
  try {
    const [registro] = await db
      .delete(regrasTiposLogisticosFreteTable)
      .where(eq(regrasTiposLogisticosFreteTable.id, regraTipoLogisticoFreteId))
      .returning({ id: regrasTiposLogisticosFreteTable.id });
    if (!registro) return { sucesso: false as const, erro: "Regra não encontrada" };
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[removerRegraTipoLogisticoFrete]", erro);
    return { sucesso: false as const, erro: "Falha ao remover regra por tipo logístico" };
  }
}

