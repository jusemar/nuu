"use server";

import { db } from "@/db/connection";
import { regrasTiposLogisticosFreteTable } from "@/db/schema";
import { criarRegraTipoLogisticoFreteSchema } from "@/features/admin/logistica/schemas/tipos-logisticos-admin.schema";
import { revalidatePath } from "next/cache";

export async function criarRegraTipoLogisticoFrete(entrada: unknown) {
  const validacao = criarRegraTipoLogisticoFreteSchema.safeParse(entrada);
  if (!validacao.success) {
    return { sucesso: false as const, erro: validacao.error.issues.map((e) => e.message).join(", ") };
  }
  try {
    const [registro] = await db
      .insert(regrasTiposLogisticosFreteTable)
      .values(validacao.data)
      .returning({ id: regrasTiposLogisticosFreteTable.id });
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[criarRegraTipoLogisticoFrete]", erro);
    return { sucesso: false as const, erro: "Falha ao criar regra por tipo logístico" };
  }
}

