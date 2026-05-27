"use server";

import { db } from "@/db/connection";
import { servicosFreteTable } from "@/db/schema";
import { editarServicoFreteSchema } from "@/features/admin/logistica/schemas/frete-admin.schema";
import type { RespostaAcaoAdminFrete } from "@/features/admin/logistica/types/frete-admin.types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function editarServicoFrete(
  servicoFreteId: string,
  entrada: unknown,
): Promise<RespostaAcaoAdminFrete<{ id: string }>> {
  if (!servicoFreteId) {
    return { sucesso: false, erro: "ID do serviço é obrigatório" };
  }

  const validacao = editarServicoFreteSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false,
      erro: validacao.error.issues.map((erro) => erro.message).join(", "),
    };
  }

  if (Object.keys(validacao.data).length === 0) {
    return { sucesso: false, erro: "Nenhum campo para atualizar" };
  }

  try {
    const [registro] = await db
      .update(servicosFreteTable)
      .set({
        ...validacao.data,
        updatedAt: new Date(),
      })
      .where(eq(servicosFreteTable.id, servicoFreteId))
      .returning({ id: servicosFreteTable.id });

    if (!registro) {
      return { sucesso: false, erro: "Serviço não encontrado" };
    }

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[editarServicoFrete]", erro);
    return { sucesso: false, erro: "Falha ao editar serviço de frete" };
  }
}
