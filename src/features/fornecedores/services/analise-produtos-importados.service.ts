import { eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutosStagingTable,
  importacoesFornecedorTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

import type {
  CriterioLocalizacaoProdutoFornecedor,
  ResultadoAnaliseProdutosImportados,
  ResumoConferenciaFornecedor,
} from "../types/fornecedores.types";
import { localizarProdutosPorVinculoFornecedor } from "./localizar-por-vinculo.service";

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

type LinhaNaoLocalizadaParaAtualizacao = {
  id: string;
  criterioLocalizacao: Extract<
    CriterioLocalizacaoProdutoFornecedor,
    "sem_codigo_fornecedor" | "sem_vinculo_encontrado" | "nao_localizado"
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

async function atualizarLinhasNaoLocalizadas(
  linhas: LinhaNaoLocalizadaParaAtualizacao[],
) {
  if (linhas.length === 0) return;

  await dbTransacional.execute(sql`
    UPDATE fornecedor_produtos_staging
    SET
      status = 'nao_localizado',
      produto_localizado_id = NULL,
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

export async function analisarProdutosImportadosFornecedor(
  importacaoId: string,
): Promise<ResultadoAnaliseProdutosImportados> {
  // Este service roda em dois pontos do fluxo: no "Continuar para vínculos" (chamado pelo
  // service de mapeamento) e no botão "Atualizar vinculação". Como ele lê ANTES de gravar,
  // uma leitura que falha aqui aborta a operação inteira — por isso a proteção.
  const { importacao, linhas } = await executarLeituraFornecedores(
    {
      etapa: "vinculacao:carregar-linhas-para-analise",
      importacaoId,
      mensagemAmigavel:
        "Não foi possível carregar os produtos para vincular agora. Tente novamente em alguns segundos.",
    },
    async () => {
      const [registro] = await db
        .select({
          fornecedorId: importacoesFornecedorTable.fornecedorId,
        })
        .from(importacoesFornecedorTable)
        .where(eq(importacoesFornecedorTable.id, importacaoId))
        .limit(1);

      return {
        importacao: registro ?? null,
        linhas: registro
          ? await db
              .select({
                id: fornecedorProdutosStagingTable.id,
                codigoFornecedor:
                  fornecedorProdutosStagingTable.codigoFornecedor,
                status: fornecedorProdutosStagingTable.status,
              })
              .from(fornecedorProdutosStagingTable)
              .where(
                eq(fornecedorProdutosStagingTable.importacaoId, importacaoId),
              )
          : [],
      };
    },
  );

  if (!importacao) {
    throw new Error("Importação de fornecedor não encontrada.");
  }

  const linhasValidasParaAnalise = linhas.filter(
    (linha) =>
      linha.status !== "erro" &&
      linha.status !== "rejeitado" &&
      linha.status !== "ignorado",
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

  const idsLocalizados = new Set(
    linhasLocalizadasPorVinculo.map((linha) => linha.id),
  );
  const linhasNaoLocalizadas = linhasValidasParaAnalise
    .filter((linha) => !idsLocalizados.has(linha.id))
    .map<LinhaNaoLocalizadaParaAtualizacao>((linha) => {
      /**
       * Diagnóstico da ANÁLISE, não decisão do gestor.
       *
       * Aqui se gravava `novo_produto_fornecedor` para toda linha sem vínculo —
       * e a tela lia isso como "o gestor marcou para criar produto novo". O
       * efeito: 632 itens jamais tocados apareciam como "Novos" e o balde
       * "Pendentes" ficava permanentemente vazio. Decisão de criar produto novo
       * é registrada no RASCUNHO, que só nasce de uma ação na tela.
       */
      const criterioLocalizacao: LinhaNaoLocalizadaParaAtualizacao["criterioLocalizacao"] =
        linha.codigoFornecedor?.trim()
          ? "sem_vinculo_encontrado"
          : "sem_codigo_fornecedor";

      return {
        id: linha.id,
        criterioLocalizacao,
      };
    });

  await atualizarLinhasLocalizadas(linhasLocalizadasPorVinculo);
  await atualizarLinhasNaoLocalizadas(linhasNaoLocalizadas);

  await db
    .update(importacoesFornecedorTable)
    .set({ status: "em_homologacao", atualizadoEm: new Date() })
    .where(eq(importacoesFornecedorTable.id, importacaoId));

  // Releitura só para montar o resumo. As gravações acima já foram concluídas, então esta
  // leitura pode ser repetida sem risco de duplicar efeito.
  const linhasAnalisadas = await executarLeituraFornecedores(
    {
      etapa: "vinculacao:reler-linhas-analisadas",
      importacaoId,
      mensagemAmigavel:
        "A vinculação foi processada, mas não foi possível carregar o resumo agora. Atualize a página em alguns segundos.",
    },
    () =>
      db
        .select({
          id: fornecedorProdutosStagingTable.id,
          codigoFornecedor: fornecedorProdutosStagingTable.codigoFornecedor,
          status: fornecedorProdutosStagingTable.status,
        })
        .from(fornecedorProdutosStagingTable)
        .where(eq(fornecedorProdutosStagingTable.importacaoId, importacaoId)),
  );

  return {
    importacaoId,
    ...montarResumo(linhasAnalisadas),
  };
}
