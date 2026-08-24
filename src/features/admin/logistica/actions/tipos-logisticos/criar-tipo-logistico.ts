"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { tiposLogisticosTable } from "@/db/schema";
import { criarTipoLogisticoSchema } from "@/features/admin/logistica/schemas/tipos-logisticos-admin.schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function criarTipoLogistico(entrada: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const validacao = criarTipoLogisticoSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false as const,
      erro: validacao.error.issues.map((e) => e.message).join(", "),
    };
  }

  try {
    const [registro] = await db
      .insert(tiposLogisticosTable)
      .values(validacao.data)
      .returning({ id: tiposLogisticosTable.id });
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[criarTipoLogistico]", erro);
    return { sucesso: false as const, erro: "Falha ao criar tipo logístico" };
  }
}
