"use server";

import { db } from "@/db/connection";
import { regrasCategoriasFreteTable } from "@/db/schema";
import { criarRegraCategoriaFreteSchema } from "@/features/admin/logistica/schemas/regras-categorias-frete-admin.schema";
import { revalidatePath } from "next/cache";

export async function criarRegraCategoriaFrete(entrada: unknown) {
  const validacao = criarRegraCategoriaFreteSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false as const,
      erro: validacao.error.issues.map((erro) => erro.message).join(", "),
    };
  }

  try {
    const [registro] = await db
      .insert(regrasCategoriasFreteTable)
      .values(validacao.data)
      .returning({ id: regrasCategoriasFreteTable.id });

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[criarRegraCategoriaFrete]", erro);
    return { sucesso: false as const, erro: "Falha ao criar regra por categoria" };
  }
}

