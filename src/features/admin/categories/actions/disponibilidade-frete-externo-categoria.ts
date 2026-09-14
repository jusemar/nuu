"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { categoryTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { salvarFreteExternoCategoriaSchema } from "@/features/logistica/schemas/disponibilidade-frete-externo.schema";

/**
 * Salva Herdar/Ativado/Desativado do Frete Externo da categoria. Afeta os
 * produtos (e subcategorias) que herdam; produto com valor próprio vence.
 */
export async function salvarDisponibilidadeFreteExternoCategoria(
  entrada: unknown,
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR);

  const validacao = salvarFreteExternoCategoriaSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false as const,
      erro: validacao.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const [atualizada] = await db
    .update(categoryTable)
    .set({
      disponibilidadeFreteExterno: validacao.data.modo,
      updatedAt: new Date(),
    })
    .where(eq(categoryTable.id, validacao.data.categoriaId))
    .returning({ id: categoryTable.id });

  if (!atualizada) {
    return { sucesso: false as const, erro: "Categoria não encontrada." };
  }

  revalidatePath(`/admin/categories/${atualizada.id}`);
  return { sucesso: true as const };
}
