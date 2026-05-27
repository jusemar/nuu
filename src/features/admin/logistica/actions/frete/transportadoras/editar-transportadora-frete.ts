"use server";

import { db } from "@/db/connection";
import { transportadorasFreteTable } from "@/db/schema";
import { editarTransportadoraFreteSchema } from "@/features/admin/logistica/schemas/frete-admin.schema";
import type { RespostaAcaoAdminFrete } from "@/features/admin/logistica/types/frete-admin.types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function editarTransportadoraFrete(
  transportadoraFreteId: string,
  entrada: unknown,
): Promise<RespostaAcaoAdminFrete<{ id: string }>> {
  if (!transportadoraFreteId) {
    return { sucesso: false, erro: "ID da transportadora é obrigatório" };
  }

  const validacao = editarTransportadoraFreteSchema.safeParse(entrada);
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
      .update(transportadorasFreteTable)
      .set({
        ...validacao.data,
        updatedAt: new Date(),
      })
      .where(eq(transportadorasFreteTable.id, transportadoraFreteId))
      .returning({ id: transportadorasFreteTable.id });

    if (!registro) {
      return { sucesso: false, erro: "Transportadora não encontrada" };
    }

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[editarTransportadoraFrete]", erro);
    return { sucesso: false, erro: "Falha ao editar transportadora" };
  }
}
