"use server";

import { db } from "@/db/connection";
import { pontosColetaTable } from "@/db/table/retirada/pontos-coleta";
import { criarPontoColetaSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import { revalidatePath } from "next/cache";

export async function criarPontoColeta(dados: unknown) {
  const parse = criarPontoColetaSchema.safeParse(dados);
  if (!parse.success) {
    return {
      success: false,
      error: parse.error.issues.map((e) => e.message).join(", "),
    };
  }

  try {
    await db.insert(pontosColetaTable).values({
      ...parse.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/admin/logistica/retirada-local");
    return { success: true, data: null };
  } catch (err) {
    console.error("[criarPontoColeta]", err);
    return { success: false, error: "Erro ao criar ponto de coleta" };
  }
}