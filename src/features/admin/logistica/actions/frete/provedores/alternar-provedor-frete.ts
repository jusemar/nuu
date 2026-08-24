"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { provedoresFreteTable } from "@/db/schema";
import { alternarAtivacaoSchema } from "@/features/admin/logistica/schemas/frete-admin.schema";
import type { RespostaAcaoAdminFrete } from "@/features/admin/logistica/types/frete-admin.types";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function alternarProvedorFrete(
  provedorFreteId: string,
  entrada: unknown,
): Promise<RespostaAcaoAdminFrete<{ id: string; ativo: boolean }>> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  if (!provedorFreteId) {
    return { sucesso: false, erro: "ID do provedor é obrigatório" };
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
      .update(provedoresFreteTable)
      .set({
        ativo: validacao.data.ativo,
        updatedAt: new Date(),
      })
      .where(eq(provedoresFreteTable.id, provedorFreteId))
      .returning({
        id: provedoresFreteTable.id,
        ativo: provedoresFreteTable.ativo,
      });

    if (!registro) {
      return { sucesso: false, erro: "Provedor de frete não encontrado" };
    }

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true, dados: registro };
  } catch (erro) {
    console.error("[alternarProvedorFrete]", erro);
    return { sucesso: false, erro: "Falha ao atualizar status do provedor" };
  }
}
