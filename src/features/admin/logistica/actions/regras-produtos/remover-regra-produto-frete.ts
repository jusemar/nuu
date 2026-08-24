"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { regrasProdutosFreteTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function removerRegraProdutoFrete(regraProdutoFreteId: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  if (!regraProdutoFreteId) {
    return { sucesso: false as const, erro: "ID da regra é obrigatório" };
  }

  try {
    const [registro] = await db
      .delete(regrasProdutosFreteTable)
      .where(eq(regrasProdutosFreteTable.id, regraProdutoFreteId))
      .returning({ id: regrasProdutosFreteTable.id });

    if (!registro)
      return { sucesso: false as const, erro: "Regra não encontrada" };

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[removerRegraProdutoFrete]", erro);
    return {
      sucesso: false as const,
      erro: "Falha ao remover regra por produto",
    };
  }
}
