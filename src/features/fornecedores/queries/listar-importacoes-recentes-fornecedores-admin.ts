import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedoresTable, importacoesFornecedorTable } from "@/db/schema";

type EntradaListagemImportacoesRecentesFornecedorAdmin = {
  pagina?: number;
  limite?: number;
};

const limitesPermitidos = [4, 8, 12];

function normalizarPagina(valor?: number) {
  return valor && valor > 0 ? valor : 1;
}

function normalizarLimite(valor?: number) {
  return valor && limitesPermitidos.includes(valor) ? valor : 4;
}

export async function listarImportacoesRecentesFornecedoresAdmin(
  entrada: EntradaListagemImportacoesRecentesFornecedorAdmin = {},
) {
  const pagina = normalizarPagina(entrada.pagina);
  const limite = normalizarLimite(entrada.limite);
  const offset = (pagina - 1) * limite;

  const [itens, total, totaisStatus] = await Promise.all([
    db
      .select({
        id: importacoesFornecedorTable.id,
        fornecedorId: importacoesFornecedorTable.fornecedorId,
        nomeFornecedor: fornecedoresTable.nome,
        nomeArquivo: importacoesFornecedorTable.nomeArquivo,
        totalLinhas: importacoesFornecedorTable.totalLinhas,
        totalProcessadas: importacoesFornecedorTable.totalProcessadas,
        totalErros: importacoesFornecedorTable.totalErros,
        status: importacoesFornecedorTable.status,
        criadoEm: importacoesFornecedorTable.criadoEm,
      })
      .from(importacoesFornecedorTable)
      .innerJoin(
        fornecedoresTable,
        eq(importacoesFornecedorTable.fornecedorId, fornecedoresTable.id),
      )
      .orderBy(desc(importacoesFornecedorTable.criadoEm))
      .limit(limite)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)` })
      .from(importacoesFornecedorTable),
    db
      .select({
        status: importacoesFornecedorTable.status,
        total: sql<number>`count(*)`,
      })
      .from(importacoesFornecedorTable)
      .groupBy(importacoesFornecedorTable.status),
  ]);

  return {
    itens,
    totaisStatus: Object.fromEntries(
      totaisStatus.map((item) => [item.status, Number(item.total)]),
    ) as Record<string, number>,
    paginacao: {
      pagina,
      limite,
      total: Number(total[0]?.total ?? 0),
      totalPaginas: Math.max(
        1,
        Math.ceil(Number(total[0]?.total ?? 0) / limite),
      ),
    },
  };
}
