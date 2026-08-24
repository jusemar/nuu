"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { importacoesFornecedorTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

import { exigirAcessoFornecedoresAdmin } from "../lib/sessao-fornecedores-admin";
import { importacaoFornecedorSchema } from "../schemas/fornecedores.schema";

export async function criarImportacaoFornecedor(dadosEntrada: unknown) {
  await exigirAcessoFornecedoresAdmin(PERMISSOES_ADMIN.FORNECEDORES.IMPORTAR);
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
