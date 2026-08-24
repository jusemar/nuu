"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { produtosTiposLogisticosTable } from "@/db/schema";
import { vincularProdutoTipoLogisticoSchema } from "@/features/admin/logistica/schemas/tipos-logisticos-admin.schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function vincularProdutoTipoLogistico(entrada: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const validacao = vincularProdutoTipoLogisticoSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false as const,
      erro: validacao.error.issues.map((e) => e.message).join(", "),
    };
  }

  try {
    const [registro] = await db
      .insert(produtosTiposLogisticosTable)
      .values(validacao.data)
      .returning({ id: produtosTiposLogisticosTable.id });
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[vincularProdutoTipoLogistico]", erro);
    return {
      sucesso: false as const,
      erro: "Falha ao vincular produto ao tipo logístico",
    };
  }
}
