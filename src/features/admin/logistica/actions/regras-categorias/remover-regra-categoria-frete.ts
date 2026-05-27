"use server";

import { db } from "@/db/connection";
import { regrasCategoriasFreteTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function removerRegraCategoriaFrete(regraCategoriaFreteId: string) {
  if (!regraCategoriaFreteId) {
    return { sucesso: false as const, erro: "ID da regra é obrigatório" };
  }

  try {
    const [registro] = await db
      .delete(regrasCategoriasFreteTable)
      .where(eq(regrasCategoriasFreteTable.id, regraCategoriaFreteId))
      .returning({ id: regrasCategoriasFreteTable.id });

    if (!registro) return { sucesso: false as const, erro: "Regra não encontrada" };

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[removerRegraCategoriaFrete]", erro);
    return { sucesso: false as const, erro: "Falha ao remover regra por categoria" };
  }
}

