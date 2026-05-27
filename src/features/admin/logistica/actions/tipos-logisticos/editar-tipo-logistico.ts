"use server";

import { db } from "@/db/connection";
import { tiposLogisticosTable } from "@/db/schema";
import { editarTipoLogisticoSchema } from "@/features/admin/logistica/schemas/tipos-logisticos-admin.schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function editarTipoLogistico(tipoLogisticoId: string, entrada: unknown) {
  if (!tipoLogisticoId) return { sucesso: false as const, erro: "ID do tipo logístico é obrigatório" };
  const validacao = editarTipoLogisticoSchema.safeParse(entrada);
  if (!validacao.success) {
    return { sucesso: false as const, erro: validacao.error.issues.map((e) => e.message).join(", ") };
  }
  if (Object.keys(validacao.data).length === 0) return { sucesso: false as const, erro: "Nenhum campo para atualizar" };

  try {
    const [registro] = await db
      .update(tiposLogisticosTable)
      .set({ ...validacao.data, updatedAt: new Date() })
      .where(eq(tiposLogisticosTable.id, tipoLogisticoId))
      .returning({ id: tiposLogisticosTable.id });
    if (!registro) return { sucesso: false as const, erro: "Tipo logístico não encontrado" };
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[editarTipoLogistico]", erro);
    return { sucesso: false as const, erro: "Falha ao editar tipo logístico" };
  }
}

