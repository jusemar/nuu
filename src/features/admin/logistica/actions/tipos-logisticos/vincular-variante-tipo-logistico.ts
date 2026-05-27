"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { variantesTiposLogisticosTable } from "@/db/schema";
import { vincularVarianteTipoLogisticoSchema } from "@/features/admin/logistica/schemas/tipos-logisticos-admin.schema";

export async function vincularVarianteTipoLogistico(entrada: unknown) {
  const validacao = vincularVarianteTipoLogisticoSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false as const,
      erro: validacao.error.issues.map((erro) => erro.message).join(", "),
    };
  }

  try {
    const [registro] = await db
      .insert(variantesTiposLogisticosTable)
      .values(validacao.data)
      .returning({ id: variantesTiposLogisticosTable.id });

    revalidatePath("/admin/products");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[vincularVarianteTipoLogistico]", erro);
    return {
      sucesso: false as const,
      erro: "Falha ao vincular variante à classificação logística",
    };
  }
}
