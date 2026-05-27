"use server";

import { db } from "@/db/connection";
import { provedoresFreteTable } from "@/db/schema";
import { editarProvedorFreteSchema } from "@/features/admin/logistica/schemas/frete-admin.schema";
import type { RespostaAcaoAdminFrete } from "@/features/admin/logistica/types/frete-admin.types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function editarProvedorFrete(
  provedorFreteId: string,
  entrada: unknown,
): Promise<RespostaAcaoAdminFrete<{ id: string }>> {
  if (!provedorFreteId) {
    return { sucesso: false, erro: "ID do provedor é obrigatório" };
  }

  const validacao = editarProvedorFreteSchema.safeParse(entrada);
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
      .update(provedoresFreteTable)
      .set({
        ...validacao.data,
        updatedAt: new Date(),
      })
      .where(eq(provedoresFreteTable.id, provedorFreteId))
      .returning({ id: provedoresFreteTable.id });

    if (!registro) {
      return { sucesso: false, erro: "Provedor de frete não encontrado" };
    }

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[editarProvedorFrete]", erro);
    return { sucesso: false, erro: "Falha ao editar provedor de frete" };
  }
}
