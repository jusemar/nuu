"use server";

import { db } from "@/db/connection";
import { regrasProdutosFreteTable } from "@/db/schema";
import { criarRegraProdutoFreteSchema } from "@/features/admin/logistica/schemas/regras-produtos-frete-admin.schema";
import { revalidatePath } from "next/cache";

export async function criarRegraProdutoFrete(entrada: unknown) {
  const validacao = criarRegraProdutoFreteSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false as const,
      erro: validacao.error.issues.map((erro) => erro.message).join(", "),
    };
  }

  try {
    const [registro] = await db
      .insert(regrasProdutosFreteTable)
      .values(validacao.data)
      .returning({ id: regrasProdutosFreteTable.id });

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[criarRegraProdutoFrete]", erro);
    return { sucesso: false as const, erro: "Falha ao criar regra por produto" };
  }
}

