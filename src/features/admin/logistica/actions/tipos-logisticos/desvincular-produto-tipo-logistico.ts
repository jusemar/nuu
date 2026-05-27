"use server";

import { db } from "@/db/connection";
import { produtosTiposLogisticosTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function desvincularProdutoTipoLogistico(vinculoId: string) {
  if (!vinculoId) return { sucesso: false as const, erro: "ID do vínculo é obrigatório" };
  try {
    const [registro] = await db
      .delete(produtosTiposLogisticosTable)
      .where(eq(produtosTiposLogisticosTable.id, vinculoId))
      .returning({ id: produtosTiposLogisticosTable.id });
    if (!registro) return { sucesso: false as const, erro: "Vínculo não encontrado" };
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[desvincularProdutoTipoLogistico]", erro);
    return { sucesso: false as const, erro: "Falha ao desvincular produto do tipo logístico" };
  }
}

