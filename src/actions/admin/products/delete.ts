"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  autorizacoesProdutosRepresentantesTable,
  productPricingTable,
  productTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function deleteProduct(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR);
  const produtoId = z.uuid().parse(id);
  try {
    const resultado = await dbTransacional.transaction(async (transacao) => {
      // O bloqueio serializa a exclusão com novas referências ao produto.
      const [produto] = await transacao
        .select({ id: productTable.id })
        .from(productTable)
        .where(eq(productTable.id, produtoId))
        .for("update");
      if (!produto)
        return { success: false, message: "Produto não encontrado." };
      const [historico] = await transacao
        .select({ id: autorizacoesProdutosRepresentantesTable.id })
        .from(autorizacoesProdutosRepresentantesTable)
        .where(eq(autorizacoesProdutosRepresentantesTable.produtoId, produtoId))
        .limit(1);
      // Autorizações revogadas também são histórico: jamais apagá-las em cascata.
      if (historico)
        return {
          success: false,
          message:
            "Produto possui histórico de autorizações de representantes. Desative ou arquive o produto.",
        };
      await transacao
        .delete(productPricingTable)
        .where(eq(productPricingTable.productId, produtoId));
      await transacao
        .delete(productTable)
        .where(eq(productTable.id, produtoId));
      return { success: true, message: "Produto deletado com sucesso!" };
    });
    if (resultado.success) revalidatePath("/admin/products");
    return resultado;
  } catch (erro) {
    // Qualquer outra FK restritiva desfaz também a remoção dos preços.
    console.error("Erro ao deletar produto:", erro);
    return {
      success: false,
      message:
        "Não foi possível excluir o produto. Verifique os vínculos existentes.",
    };
  }
}
