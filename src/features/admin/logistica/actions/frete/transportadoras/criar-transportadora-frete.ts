"use server";

import { db } from "@/db/connection";
import { transportadorasFreteTable } from "@/db/schema";
import { criarTransportadoraFreteSchema } from "@/features/admin/logistica/schemas/frete-admin.schema";
import type { RespostaAcaoAdminFrete } from "@/features/admin/logistica/types/frete-admin.types";
import { revalidatePath } from "next/cache";

export async function criarTransportadoraFrete(
  entrada: unknown,
): Promise<RespostaAcaoAdminFrete<{ id: string }>> {
  const validacao = criarTransportadoraFreteSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false,
      erro: validacao.error.issues.map((erro) => erro.message).join(", "),
    };
  }

  try {
    const [registro] = await db
      .insert(transportadorasFreteTable)
      .values(validacao.data)
      .returning({ id: transportadorasFreteTable.id });

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[criarTransportadoraFrete]", erro);
    return { sucesso: false, erro: "Falha ao criar transportadora" };
  }
}
