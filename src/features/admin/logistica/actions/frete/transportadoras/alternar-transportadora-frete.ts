"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { transportadorasFreteTable } from "@/db/schema";
import { alternarAtivacaoSchema } from "@/features/admin/logistica/schemas/frete-admin.schema";
import type { RespostaAcaoAdminFrete } from "@/features/admin/logistica/types/frete-admin.types";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function alternarTransportadoraFrete(
  transportadoraFreteId: string,
  entrada: unknown,
): Promise<RespostaAcaoAdminFrete<{ id: string; ativo: boolean }>> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  if (!transportadoraFreteId) {
    return { sucesso: false, erro: "ID da transportadora é obrigatório" };
  }

  const validacao = alternarAtivacaoSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false,
      erro: validacao.error.issues.map((erro) => erro.message).join(", "),
    };
  }

  try {
    const [registro] = await db
      .update(transportadorasFreteTable)
      .set({
        ativo: validacao.data.ativo,
        updatedAt: new Date(),
      })
      .where(eq(transportadorasFreteTable.id, transportadoraFreteId))
      .returning({
        id: transportadorasFreteTable.id,
        ativo: transportadorasFreteTable.ativo,
      });

    if (!registro) {
      return { sucesso: false, erro: "Transportadora não encontrada" };
    }

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true, dados: registro };
  } catch (erro) {
    console.error("[alternarTransportadoraFrete]", erro);
    return {
      sucesso: false,
      erro: "Falha ao atualizar status da transportadora",
    };
  }
}
