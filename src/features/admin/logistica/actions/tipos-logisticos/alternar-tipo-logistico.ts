"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { tiposLogisticosTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function alternarTipoLogistico(
  tipoLogisticoId: string,
  ativo: boolean,
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  if (!tipoLogisticoId)
    return {
      sucesso: false as const,
      erro: "ID do tipo logístico é obrigatório",
    };
  try {
    const [registro] = await db
      .update(tiposLogisticosTable)
      .set({ ativo, updatedAt: new Date() })
      .where(eq(tiposLogisticosTable.id, tipoLogisticoId))
      .returning({
        id: tiposLogisticosTable.id,
        ativo: tiposLogisticosTable.ativo,
      });
    if (!registro)
      return { sucesso: false as const, erro: "Tipo logístico não encontrado" };
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: registro };
  } catch (erro) {
    console.error("[alternarTipoLogistico]", erro);
    return {
      sucesso: false as const,
      erro: "Falha ao alternar tipo logístico",
    };
  }
}
