import { eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutosStagingTable,
  importacoesFornecedorTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type {
  CriterioLocalizacaoProdutoFornecedor,
  ResultadoAnaliseProdutosImportados,
  ResumoConferenciaFornecedor,
} from "../types/fornecedores.types";
import { localizarProdutosPorVinculoFornecedor } from "./localizar-por-vinculo.service";
import { localizarProdutosPorCodigoFornecedorSku } from "./localizacao-produtos.service";

type LinhaParaAnalise = {
  id: string;
  codigoFornecedor: string | null;
  status: string;
};

type LinhaLocalizadaParaAtualizacao = {
  id: string;
  produtoId: string;
  criterioLocalizacao: Exclude<
    CriterioLocalizacaoProdutoFornecedor,
    "nao_localizado"
  >;
};

function montarResumo(linhas: LinhaParaAnalise[]): ResumoConferenciaFornecedor {
  return {
    totalImportado: linhas.length,
    totalEncontrados: linhas.filter((linha) => linha.status === "localizado")
      .length,
    totalNaoEncontrados: linhas.filter(
      (linha) => linha.status === "nao_localizado",
    ).length,
    totalErros: linhas.filter((linha) => linha.status === "erro").length,
  };
}

async function atualizarLinhasLocalizadas(
  linhas: LinhaLocalizadaParaAtualizacao[],
) {
  if (linhas.length === 0) return;

  await dbTransacional.execute(sql`
    UPDATE fornecedor_produtos_staging
    SET
      status = 'localizado',
      produto_localizado_id = CASE id ${sql.join(
        linhas.map(
          (linha) => sql`WHEN ${linha.id}::uuid THEN ${linha.produtoId}::uuid`,
        ),
        sql.raw(" "),
      )} END,
      criterio_localizacao = CASE id ${sql.join(
        linhas.map(
          (linha) =>
            sql`WHEN ${linha.id}::uuid THEN ${linha.criterioLocalizacao}`,
        ),
        sql.raw(" "),
      )} END,
      atualizado_em = now()
    WHERE id IN (${sql.join(
      linhas.map((linha) => sql`${linha.id}::uuid`),
      sql.raw(", "),
    )})
  `);
}

async function atualizarLinhasNaoLocalizadas(idsNaoLocalizados: string[]) {
  if (idsNaoLocalizados.length === 0) return;

  await dbTransacional.execute(sql`
    UPDATE fornecedor_produtos_staging
    SET
      status = 'nao_localizado',
      produto_localizado_id = NULL,
      criterio_localizacao = 'nao_localizado',
      atualizado_em = now()
    WHERE id IN (${sql.join(
      idsNaoLocalizados.map((id) => sql`${id}::uuid`),
      sql.raw(", "),
    )})
  `);
}

export async function analisarProdutosImportadosFornecedor(
  importacaoId: string,
): Promise<ResultadoAnaliseProdutosImportados> {
  const [importacao] = await db
    .select({
      fornecedorId: importacoesFornecedorTable.fornecedorId,
    })
    .from(importacoesFornecedorTable)
    .where(eq(importacoesFornecedorTable.id, importacaoId))
    .limit(1);

  if (!importacao) {
    throw new Error("Importação de fornecedor não encontrada.");
  }

  const linhas = await db
    .select({
      id: fornecedorProdutosStagingTable.id,
      codigoFornecedor: fornecedorProdutosStagingTable.codigoFornecedor,
      status: fornecedorProdutosStagingTable.status,
    })
    .from(fornecedorProdutosStagingTable)
    .where(eq(fornecedorProdutosStagingTable.importacaoId, importacaoId));

  const linhasValidasParaAnalise = linhas.filter(
    (linha) => linha.status !== "erro" && linha.status !== "rejeitado",
  );

  const resultadoPorVinculo = await localizarProdutosPorVinculoFornecedor(
    importacao.fornecedorId,
    linhasValidasParaAnalise.map((linha) => linha.codigoFornecedor),
  );

  const linhasLocalizadasPorVinculo = linhasValidasParaAnalise.reduce<
    LinhaLocalizadaParaAtualizacao[]
  >((linhasLocalizadas, linha) => {
    const codigoFornecedor = linha.codigoFornecedor?.trim();
    const produto = codigoFornecedor
      ? resultadoPorVinculo.encontradosPorCodigo.get(codigoFornecedor)
      : null;

    if (produto) {
      linhasLocalizadas.push({
        id: linha.id,
        produtoId: produto.produtoId,
        criterioLocalizacao: "vinculo_fornecedor",
      });
    }

    return linhasLocalizadas;
  }, []);

  const idsLocalizadosPorVinculo = new Set(
    linhasLocalizadasPorVinculo.map((linha) => linha.id),
  );
  const linhasSemVinculo = linhasValidasParaAnalise.filter(
    (linha) => !idsLocalizadosPorVinculo.has(linha.id),
  );
  const resultadoPorSku = await localizarProdutosPorCodigoFornecedorSku(
    linhasSemVinculo.map((linha) => linha.codigoFornecedor),
  );

  const linhasLocalizadasPorSku = linhasSemVinculo.reduce<
    LinhaLocalizadaParaAtualizacao[]
  >((linhasLocalizadas, linha) => {
    const codigoFornecedor = linha.codigoFornecedor?.trim();
    const produto = codigoFornecedor
      ? resultadoPorSku.encontradosPorCodigo.get(codigoFornecedor)
      : null;

    if (produto) {
      linhasLocalizadas.push({
        id: linha.id,
        produtoId: produto.produtoId,
        criterioLocalizacao: "codigo_fornecedor_sku",
      });
    }

    return linhasLocalizadas;
  }, []);

  const linhasLocalizadas = [
    ...linhasLocalizadasPorVinculo,
    ...linhasLocalizadasPorSku,
  ];
  const idsLocalizados = new Set(linhasLocalizadas.map((linha) => linha.id));
  const idsNaoLocalizados = linhasValidasParaAnalise
    .filter((linha) => !idsLocalizados.has(linha.id))
    .map((linha) => linha.id);

  await atualizarLinhasLocalizadas(linhasLocalizadas);
  await atualizarLinhasNaoLocalizadas(idsNaoLocalizados);

  await db
    .update(importacoesFornecedorTable)
    .set({ status: "em_homologacao", atualizadoEm: new Date() })
    .where(eq(importacoesFornecedorTable.id, importacaoId));

  const linhasAnalisadas = await db
    .select({
      id: fornecedorProdutosStagingTable.id,
      codigoFornecedor: fornecedorProdutosStagingTable.codigoFornecedor,
      status: fornecedorProdutosStagingTable.status,
    })
    .from(fornecedorProdutosStagingTable)
    .where(eq(fornecedorProdutosStagingTable.importacaoId, importacaoId));

  return {
    importacaoId,
    ...montarResumo(linhasAnalisadas),
  };
}
