"use server";

import { db } from "@/db/connection";
import { produtoRetiradaTable } from "@/db/table/retirada/produto-retirada";
import { criarProdutoRetiradaSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function salvarProdutoRetirada(productId: string, associacoes: unknown[]) {
  if (!productId) {
    return { success: false, error: "ID do produto é obrigatório" };
  }

  const validadas = [];
  for (const item of associacoes) {
    const parse = criarProdutoRetiradaSchema.safeParse(item);
    if (!parse.success) {
      return {
        success: false,
        error: "Dados inválidos: " + parse.error.issues.map((e) => e.message).join(", "),
      };
    }
    validadas.push(parse.data);
  }

  try {
    await db.delete(produtoRetiradaTable).where(eq(produtoRetiradaTable.productId, productId));

    if (validadas.length > 0) {
      await db.insert(produtoRetiradaTable).values(
        validadas.map((v) => ({
          ...v,
          productId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }

    revalidatePath("/admin/products");
    return { success: true, data: null };
  } catch (err) {
    console.error("[salvarProdutoRetirada]", err);
    return { success: false, error: "Erro ao salvar configuração de retirada do produto" };
  }
}