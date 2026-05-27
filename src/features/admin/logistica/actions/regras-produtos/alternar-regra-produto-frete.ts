"use server";

import { db } from "@/db/connection";
import { regrasProdutosFreteTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function alternarRegraProdutoFrete(
  regraProdutoFreteId: string,
  ativo: boolean,
) {
  if (!regraProdutoFreteId) {
    return { sucesso: false as const, erro: "ID da regra é obrigatório" };
  }

  try {
    const [registro] = await db
      .update(regrasProdutosFreteTable)
      .set({ ativo, updatedAt: new Date() })
      .where(eq(regrasProdutosFreteTable.id, regraProdutoFreteId))
      .returning({ id: regrasProdutosFreteTable.id, ativo: regrasProdutosFreteTable.ativo });

    if (!registro) return { sucesso: false as const, erro: "Regra não encontrada" };

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: registro };
  } catch (erro) {
    console.error("[alternarRegraProdutoFrete]", erro);
    return { sucesso: false as const, erro: "Falha ao alternar regra por produto" };
  }
}

