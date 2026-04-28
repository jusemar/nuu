"use server";

import { db } from "@/db/connection";
import { modalidadesRetiradaTable } from "@/db/table/retirada/modalidades";
import { atualizarModalidadeSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function atualizarModalidade(id: string, dados: unknown) {
  if (!id) {
    return { success: false, error: "ID da modalidade é obrigatório" };
  }

  const parse = atualizarModalidadeSchema.safeParse(dados);
  if (!parse.success) {
    return {
      success: false,
      error: parse.error.issues.map((e) => e.message).join(", "),
    };
  }

  try {
    await db
      .update(modalidadesRetiradaTable)
      .set({
        ...parse.data,
        updatedAt: new Date(),
      })
      .where(eq(modalidadesRetiradaTable.id, id));

    revalidatePath("/admin/logistica/retirada-local");
    return { success: true, data: null };
  } catch (err) {
    console.error("[atualizarModalidade]", err);
    return { success: false, error: "Erro ao atualizar modalidade" };
  }
}