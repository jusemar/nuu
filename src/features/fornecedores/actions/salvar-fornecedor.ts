"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { fornecedoresTable } from "@/db/schema";

import { fornecedorSchema } from "../schemas/fornecedores.schema";

function normalizarEntradaFornecedor(dadosEntrada: unknown) {
  if (dadosEntrada instanceof FormData) {
    const id = String(dadosEntrada.get("id") ?? "");

    return {
      id: id || undefined,
      nome: dadosEntrada.get("nome"),
      tipoIntegracao: dadosEntrada.get("tipoIntegracao"),
      status: dadosEntrada.get("status"),
    };
  }

  return dadosEntrada;
}

export async function salvarFornecedor(dadosEntrada: unknown) {
  const dados = fornecedorSchema.parse(
    normalizarEntradaFornecedor(dadosEntrada),
  );
  const agora = new Date();

  if (dados.id) {
    await db
      .update(fornecedoresTable)
      .set({
        nome: dados.nome,
        tipoIntegracao: dados.tipoIntegracao,
        status: dados.status,
        atualizadoEm: agora,
      })
      .where(eq(fornecedoresTable.id, dados.id));
  } else {
    await db.insert(fornecedoresTable).values({
      nome: dados.nome,
      tipoIntegracao: dados.tipoIntegracao,
      status: dados.status,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  revalidatePath("/admin/fornecedores");
  revalidatePath("/admin/fornecedores/importacoes");
}
