"use server";

/* eslint-disable @typescript-eslint/no-explicit-any -- contrato legado fora do escopo desta etapa */

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { productPricingTable,productTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function deleteProduct(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR);
  try {
    // ✅ PRIMERO excluir modalidades de preço
    await db
      .delete(productPricingTable)
      .where(eq(productPricingTable.productId, id));

    // ✅ DEPOIS excluir produto principal
    await db.delete(productTable).where(eq(productTable.id, id));

    revalidatePath("/admin/products");
    return { success: true, message: "Produto deletado com sucesso!" };
  } catch (error: any) {
    console.error("Erro ao deletar produto:", error);
    return { success: false, message: "Erro interno ao deletar produto" };
  }
}
