"use server";

import { db } from "@/db/connection";
import { tiposLogisticosTable } from "@/db/schema";
import { criarTipoLogisticoSchema } from "@/features/admin/logistica/schemas/tipos-logisticos-admin.schema";
import { revalidatePath } from "next/cache";

export async function criarTipoLogistico(entrada: unknown) {
  const validacao = criarTipoLogisticoSchema.safeParse(entrada);
  if (!validacao.success) {
    return { sucesso: false as const, erro: validacao.error.issues.map((e) => e.message).join(", ") };
  }

  try {
    const [registro] = await db
      .insert(tiposLogisticosTable)
      .values(validacao.data)
      .returning({ id: tiposLogisticosTable.id });
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[criarTipoLogistico]", erro);
    return { sucesso: false as const, erro: "Falha ao criar tipo logístico" };
  }
}

