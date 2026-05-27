"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { variantesTiposLogisticosTable } from "@/db/schema";

export async function desvincularVarianteTipoLogistico(vinculoId: string) {
  if (!vinculoId) {
    return { sucesso: false as const, erro: "ID do vínculo é obrigatório" };
  }

  try {
    const [registro] = await db
      .delete(variantesTiposLogisticosTable)
      .where(eq(variantesTiposLogisticosTable.id, vinculoId))
      .returning({ id: variantesTiposLogisticosTable.id });

    if (!registro) {
      return { sucesso: false as const, erro: "Vínculo não encontrado" };
    }

    revalidatePath("/admin/products");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[desvincularVarianteTipoLogistico]", erro);
    return {
      sucesso: false as const,
      erro: "Falha ao remover classificação logística da variante",
    };
  }
}
