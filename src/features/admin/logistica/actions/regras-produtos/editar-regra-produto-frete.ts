"use server";

import { db } from "@/db/connection";
import { regrasProdutosFreteTable } from "@/db/schema";
import { editarRegraProdutoFreteSchema } from "@/features/admin/logistica/schemas/regras-produtos-frete-admin.schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function editarRegraProdutoFrete(
  regraProdutoFreteId: string,
  entrada: unknown,
) {
  if (!regraProdutoFreteId) {
    return { sucesso: false as const, erro: "ID da regra é obrigatório" };
  }

  const validacao = editarRegraProdutoFreteSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false as const,
      erro: validacao.error.issues.map((erro) => erro.message).join(", "),
    };
  }

  if (Object.keys(validacao.data).length === 0) {
    return { sucesso: false as const, erro: "Nenhum campo para atualizar" };
  }

  try {
    const [registro] = await db
      .update(regrasProdutosFreteTable)
      .set({ ...validacao.data, updatedAt: new Date() })
      .where(eq(regrasProdutosFreteTable.id, regraProdutoFreteId))
      .returning({ id: regrasProdutosFreteTable.id });

    if (!registro) return { sucesso: false as const, erro: "Regra não encontrada" };

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[editarRegraProdutoFrete]", erro);
    return { sucesso: false as const, erro: "Falha ao editar regra por produto" };
  }
}

