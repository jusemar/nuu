"use server";

import { db } from "@/db/connection";
import { regrasTiposLogisticosFreteTable } from "@/db/schema";
import { editarRegraTipoLogisticoFreteSchema } from "@/features/admin/logistica/schemas/tipos-logisticos-admin.schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function editarRegraTipoLogisticoFrete(
  regraTipoLogisticoFreteId: string,
  entrada: unknown,
) {
  if (!regraTipoLogisticoFreteId) return { sucesso: false as const, erro: "ID da regra é obrigatório" };
  const validacao = editarRegraTipoLogisticoFreteSchema.safeParse(entrada);
  if (!validacao.success) {
    return { sucesso: false as const, erro: validacao.error.issues.map((e) => e.message).join(", ") };
  }
  if (Object.keys(validacao.data).length === 0) return { sucesso: false as const, erro: "Nenhum campo para atualizar" };

  try {
    const [registro] = await db
      .update(regrasTiposLogisticosFreteTable)
      .set({ ...validacao.data, updatedAt: new Date() })
      .where(eq(regrasTiposLogisticosFreteTable.id, regraTipoLogisticoFreteId))
      .returning({ id: regrasTiposLogisticosFreteTable.id });
    if (!registro) return { sucesso: false as const, erro: "Regra não encontrada" };
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[editarRegraTipoLogisticoFrete]", erro);
    return { sucesso: false as const, erro: "Falha ao editar regra por tipo logístico" };
  }
}

