import "server-only";

import { asc, count, desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedoresTable, importacoesFornecedorTable } from "@/db/schema";

import type { FornecedorComResumoImportacoes } from "../types/fornecedores.types";

export async function listarFornecedoresAdmin(): Promise<
  FornecedorComResumoImportacoes[]
> {
  const fornecedores = await db
    .select({
      id: fornecedoresTable.id,
      nome: fornecedoresTable.nome,
      tipoIntegracao: fornecedoresTable.tipoIntegracao,
      status: fornecedoresTable.status,
      criadoEm: fornecedoresTable.criadoEm,
      atualizadoEm: fornecedoresTable.atualizadoEm,
    })
    .from(fornecedoresTable)
    .orderBy(asc(fornecedoresTable.nome));

  const resumos = await db
    .select({
      fornecedorId: importacoesFornecedorTable.fornecedorId,
      totalImportacoes: count(importacoesFornecedorTable.id),
    })
    .from(importacoesFornecedorTable)
    .groupBy(importacoesFornecedorTable.fornecedorId);

  const ultimasImportacoes = await Promise.all(
    fornecedores.map(async (fornecedor) => {
      const [ultima] = await db
        .select({ criadoEm: importacoesFornecedorTable.criadoEm })
        .from(importacoesFornecedorTable)
        .where(eq(importacoesFornecedorTable.fornecedorId, fornecedor.id))
        .orderBy(desc(importacoesFornecedorTable.criadoEm))
        .limit(1);

      return [fornecedor.id, ultima?.criadoEm ?? null] as const;
    }),
  );

  const totalPorFornecedor = new Map(
    resumos.map((resumo) => [resumo.fornecedorId, resumo.totalImportacoes]),
  );
  const ultimaPorFornecedor = new Map(ultimasImportacoes);

  return fornecedores.map((fornecedor) => ({
    ...fornecedor,
    totalImportacoes: totalPorFornecedor.get(fornecedor.id) ?? 0,
    ultimaImportacaoEm: ultimaPorFornecedor.get(fornecedor.id) ?? null,
  }));
}
