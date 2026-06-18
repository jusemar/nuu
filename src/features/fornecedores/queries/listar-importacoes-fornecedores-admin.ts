import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedoresTable, importacoesFornecedorTable } from "@/db/schema";

export async function listarImportacoesFornecedoresAdmin() {
  return db
    .select({
      id: importacoesFornecedorTable.id,
      fornecedorId: importacoesFornecedorTable.fornecedorId,
      nomeFornecedor: fornecedoresTable.nome,
      tipoIntegracaoFornecedor: fornecedoresTable.tipoIntegracao,
      tipoArquivo: importacoesFornecedorTable.tipoArquivo,
      status: importacoesFornecedorTable.status,
      nomeArquivo: importacoesFornecedorTable.nomeArquivo,
      totalLinhas: importacoesFornecedorTable.totalLinhas,
      totalProcessadas: importacoesFornecedorTable.totalProcessadas,
      totalErros: importacoesFornecedorTable.totalErros,
      colunasPlanilha: importacoesFornecedorTable.colunasPlanilha,
      mapeamentoColunas: importacoesFornecedorTable.mapeamentoColunas,
      criadoEm: importacoesFornecedorTable.criadoEm,
      atualizadoEm: importacoesFornecedorTable.atualizadoEm,
    })
    .from(importacoesFornecedorTable)
    .innerJoin(
      fornecedoresTable,
      eq(importacoesFornecedorTable.fornecedorId, fornecedoresTable.id),
    )
    .orderBy(desc(importacoesFornecedorTable.criadoEm));
}
