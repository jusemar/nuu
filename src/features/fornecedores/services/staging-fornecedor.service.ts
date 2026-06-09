import { fornecedorProdutosStagingTable } from "@/db/schema";

import type { LinhaStagingFornecedorPreparada } from "../types/fornecedores.types";

type TransacaoImportacaoFornecedor = {
  insert: (table: typeof fornecedorProdutosStagingTable) => {
    values: (
      values: (typeof fornecedorProdutosStagingTable.$inferInsert)[],
    ) => {
      returning: <TSelected extends Record<string, unknown>>(
        fields: TSelected,
      ) => Promise<TSelected[]>;
    };
  };
};

const TAMANHO_LOTE_STAGING = 500;

export async function salvarLinhasStagingFornecedor(
  tx: TransacaoImportacaoFornecedor,
  importacaoId: string,
  linhas: LinhaStagingFornecedorPreparada[],
) {
  for (let inicio = 0; inicio < linhas.length; inicio += TAMANHO_LOTE_STAGING) {
    const lote = linhas.slice(inicio, inicio + TAMANHO_LOTE_STAGING);

    await tx.insert(fornecedorProdutosStagingTable).values(
      lote.map((linha) => ({
        importacaoId,
        codigoFornecedor: linha.codigoFornecedor,
        nomeProduto: linha.nomeProduto,
        categoriaFornecedor: linha.categoriaFornecedor,
        precoFornecedor: linha.precoFornecedor,
        precoOriginal: linha.precoFornecedor,
        estoqueFornecedor: linha.estoqueFornecedor,
        errosValidacao: linha.errosValidacao,
        status: linha.status,
      })),
    );
  }
}
