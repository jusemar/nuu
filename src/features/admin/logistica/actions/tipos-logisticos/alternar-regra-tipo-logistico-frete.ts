"use server";

import { db } from "@/db/connection";
import { regrasTiposLogisticosFreteTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function alternarRegraTipoLogisticoFrete(
  regraTipoLogisticoFreteId: string,
  ativo: boolean,
) {
  if (!regraTipoLogisticoFreteId) return { sucesso: false as const, erro: "ID da regra é obrigatório" };
  try {
    const [registro] = await db
      .update(regrasTiposLogisticosFreteTable)
      .set({ ativo, updatedAt: new Date() })
      .where(eq(regrasTiposLogisticosFreteTable.id, regraTipoLogisticoFreteId))
      .returning({ id: regrasTiposLogisticosFreteTable.id, ativo: regrasTiposLogisticosFreteTable.ativo });
    if (!registro) return { sucesso: false as const, erro: "Regra não encontrada" };
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: registro };
  } catch (erro) {
    console.error("[alternarRegraTipoLogisticoFrete]", erro);
    return { sucesso: false as const, erro: "Falha ao alternar regra por tipo logístico" };
  }
}

