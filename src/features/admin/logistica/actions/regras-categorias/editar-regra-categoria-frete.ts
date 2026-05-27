"use server";

import { db } from "@/db/connection";
import { regrasCategoriasFreteTable } from "@/db/schema";
import { editarRegraCategoriaFreteSchema } from "@/features/admin/logistica/schemas/regras-categorias-frete-admin.schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function editarRegraCategoriaFrete(
  regraCategoriaFreteId: string,
  entrada: unknown,
) {
  if (!regraCategoriaFreteId) {
    return { sucesso: false as const, erro: "ID da regra é obrigatório" };
  }

  const validacao = editarRegraCategoriaFreteSchema.safeParse(entrada);
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
      .update(regrasCategoriasFreteTable)
      .set({ ...validacao.data, updatedAt: new Date() })
      .where(eq(regrasCategoriasFreteTable.id, regraCategoriaFreteId))
      .returning({ id: regrasCategoriasFreteTable.id });

    if (!registro) return { sucesso: false as const, erro: "Regra não encontrada" };

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[editarRegraCategoriaFrete]", erro);
    return { sucesso: false as const, erro: "Falha ao editar regra por categoria" };
  }
}

