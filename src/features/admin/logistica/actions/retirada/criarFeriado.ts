"use server";

import { db } from "@/db/connection";
import { feriadosTable } from "@/db/table/retirada/feriados";
import { criarFeriadoSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import { revalidatePath } from "next/cache";

export async function criarFeriado(dados: unknown) {
  const parse = criarFeriadoSchema.safeParse(dados);
  if (!parse.success) {
    return {
      success: false,
      error: parse.error.issues.map((e) => e.message).join(", "),
    };
  }

  try {
    await db.insert(feriadosTable).values({
      ...parse.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/admin/logistica/retirada-local");
    return { success: true, data: null };
  } catch (err) {
    console.error("[criarFeriado]", err);
    return { success: false, error: "Erro ao criar feriado" };
  }
}