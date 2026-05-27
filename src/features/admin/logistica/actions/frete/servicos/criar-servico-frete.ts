"use server";

import { db } from "@/db/connection";
import { servicosFreteTable } from "@/db/schema";
import { criarServicoFreteSchema } from "@/features/admin/logistica/schemas/frete-admin.schema";
import type { RespostaAcaoAdminFrete } from "@/features/admin/logistica/types/frete-admin.types";
import { revalidatePath } from "next/cache";

export async function criarServicoFrete(
  entrada: unknown,
): Promise<RespostaAcaoAdminFrete<{ id: string }>> {
  const validacao = criarServicoFreteSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false,
      erro: validacao.error.issues.map((erro) => erro.message).join(", "),
    };
  }

  try {
    const [registro] = await db
      .insert(servicosFreteTable)
      .values(validacao.data)
      .returning({ id: servicosFreteTable.id });

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[criarServicoFrete]", erro);
    return { sucesso: false, erro: "Falha ao criar serviço de frete" };
  }
}
