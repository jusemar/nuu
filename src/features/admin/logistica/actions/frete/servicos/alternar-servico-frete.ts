"use server";

import { db } from "@/db/connection";
import { servicosFreteTable } from "@/db/schema";
import { alternarAtivacaoSchema } from "@/features/admin/logistica/schemas/frete-admin.schema";
import type { RespostaAcaoAdminFrete } from "@/features/admin/logistica/types/frete-admin.types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function alternarServicoFrete(
  servicoFreteId: string,
  entrada: unknown,
): Promise<RespostaAcaoAdminFrete<{ id: string; ativo: boolean }>> {
  if (!servicoFreteId) {
    return { sucesso: false, erro: "ID do serviço é obrigatório" };
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
      .update(servicosFreteTable)
      .set({
        ativo: validacao.data.ativo,
        updatedAt: new Date(),
      })
      .where(eq(servicosFreteTable.id, servicoFreteId))
      .returning({
        id: servicosFreteTable.id,
        ativo: servicosFreteTable.ativo,
      });

    if (!registro) {
      return { sucesso: false, erro: "Serviço não encontrado" };
    }

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true, dados: registro };
  } catch (erro) {
    console.error("[alternarServicoFrete]", erro);
    return { sucesso: false, erro: "Falha ao atualizar status do serviço" };
  }
}
