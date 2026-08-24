"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { produtosTiposLogisticosTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function desvincularProdutoTipoLogistico(vinculoId: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  if (!vinculoId)
    return { sucesso: false as const, erro: "ID do vínculo é obrigatório" };
  try {
    const [registro] = await db
      .delete(produtosTiposLogisticosTable)
      .where(eq(produtosTiposLogisticosTable.id, vinculoId))
      .returning({ id: produtosTiposLogisticosTable.id });
    if (!registro)
      return { sucesso: false as const, erro: "Vínculo não encontrado" };
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[desvincularProdutoTipoLogistico]", erro);
    return {
      sucesso: false as const,
      erro: "Falha ao desvincular produto do tipo logístico",
    };
  }
}
