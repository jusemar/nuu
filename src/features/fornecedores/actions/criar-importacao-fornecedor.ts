"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { importacoesFornecedorTable } from "@/db/schema";

import { importacaoFornecedorSchema } from "../schemas/fornecedores.schema";

export async function criarImportacaoFornecedor(dadosEntrada: unknown) {
  const dados = importacaoFornecedorSchema.parse(dadosEntrada);
  const agora = new Date();

  await db.insert(importacoesFornecedorTable).values({
    fornecedorId: dados.fornecedorId,
    tipoArquivo: dados.tipoArquivo,
    status: dados.status,
    nomeArquivo: dados.nomeArquivo ?? null,
    totalLinhas: dados.totalLinhas,
    totalProcessadas: dados.totalProcessadas,
    totalErros: dados.totalErros,
    criadoEm: agora,
    atualizadoEm: agora,
  });

  revalidatePath("/admin/fornecedores/importacoes");
  return { sucesso: true };
}
