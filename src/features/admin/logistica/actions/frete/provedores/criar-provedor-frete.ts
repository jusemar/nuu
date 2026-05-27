"use server";

import { db } from "@/db/connection";
import { provedoresFreteTable } from "@/db/schema";
import { criarProvedorFreteSchema } from "@/features/admin/logistica/schemas/frete-admin.schema";
import type { RespostaAcaoAdminFrete } from "@/features/admin/logistica/types/frete-admin.types";
import { revalidatePath } from "next/cache";

export async function criarProvedorFrete(
  entrada: unknown,
): Promise<RespostaAcaoAdminFrete<{ id: string }>> {
  const validacao = criarProvedorFreteSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro: validacao.error.issues.map((erro) => erro.message).join(", "),
    };
  }

  try {
    const [registro] = await db
      .insert(provedoresFreteTable)
      .values(validacao.data)
      .returning({ id: provedoresFreteTable.id });

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[criarProvedorFrete]", erro);
    return { sucesso: false, erro: "Falha ao criar provedor de frete" };
  }
}
