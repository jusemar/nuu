"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { categoryOwnDeliveryPrices, categoryTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { montarCondicoesDestinoEntregaPropria } from "../lib/montar-condicoes-destino-entrega-propria";
import { salvarEntregaPropriaCategoriaSchema } from "../schemas/entrega-propria-categoria.schema";

/**
 * Salva a Entrega Própria da categoria: disponibilidade (Herdar/Ativado/
 * Desativado) + condições comerciais por destino. Dias e corte não entram
 * aqui: pertencem à Agenda Geográfica.
 */
export async function salvarEntregaPropriaCategoria(entrada: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR);

  const validacao = salvarEntregaPropriaCategoriaSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false as const,
      erro: validacao.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const { categoriaId, modo, precos } = validacao.data;

  try {
    const encontrada = await dbTransacional.transaction(async (tx) => {
      const [categoria] = await tx
        .update(categoryTable)
        .set({ disponibilidadeEntregaPropria: modo, updatedAt: new Date() })
        .where(eq(categoryTable.id, categoriaId))
        .returning({ id: categoryTable.id });
      if (!categoria) return false;

      // Substitui o conjunto inteiro, como o Produto já faz.
      await tx
        .delete(categoryOwnDeliveryPrices)
        .where(eq(categoryOwnDeliveryPrices.categoryId, categoriaId));
      if (precos.length > 0) {
        const agora = new Date();
        await tx.insert(categoryOwnDeliveryPrices).values(
          precos.map((item) => ({
            categoryId: categoriaId,
            ...montarCondicoesDestinoEntregaPropria(item),
            createdAt: agora,
            updatedAt: agora,
          })),
        );
      }
      return true;
    });

    if (!encontrada) {
      return { sucesso: false as const, erro: "Categoria não encontrada." };
    }
  } catch {
    return {
      sucesso: false as const,
      erro: "Não foi possível salvar. Verifique destinos, janelas e preços.",
    };
  }

  revalidatePath(`/admin/categories/${categoriaId}`);
  revalidatePath("/admin/products");
  return { sucesso: true as const };
}
