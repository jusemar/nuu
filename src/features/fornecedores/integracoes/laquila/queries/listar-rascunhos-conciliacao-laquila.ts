import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  categoryTable,
  fornecedorProdutoVinculosTable,
  marcaTable,
  produtoRascunhosTable,
} from "@/db/schema";
import {
  type ConfiguracaoComercialRascunhoFornecedor,
  extrairConfiguracaoComercialRascunhoFornecedor,
  extrairSecoesLojaRascunhoFornecedor,
} from "@/features/fornecedores/lib/conciliacao/configuracao-rascunho-fornecedor";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";

export type RascunhoConciliacaoLaquila = {
  id: string;
  codigoFornecedor: string | null;
  nome: string;
  descricao: string | null;
  categoriaId: string | null;
  categoriaNome: string | null;
  marcaId: string | null;
  marcaNome: string | null;
  ean: string | null;
  ncm: string | null;
  precoFornecedor: string | null;
  precoLoja: string | null;
  estoqueFornecedor: number | null;
  peso: string | null;
  altura: string | null;
  largura: string | null;
  comprimento: string | null;
  imagens: string[];
  secoesLoja: string[];
  configuracaoComercial: ConfiguracaoComercialRascunhoFornecedor;
  status:
    | "rascunho"
    | "pendente_conciliacao"
    | "pronto_para_publicar"
    | "ignorado"
    // Valor novo do enum compartilhado `produto_rascunho_status`. A Laquila não
    // produz esse estado hoje; consta aqui só para o tipo cobrir o enum inteiro.
    | "publicado";
};

/**
 * Rascunhos salvos por UMA execução da API, usados pela tela de Vinculação
 * para saber o que já foi preparado neste ciclo.
 *
 * O `importacaoId` é obrigatório: sem ele a #102 enxergaria os rascunhos da
 * #101 e a Vinculação mostraria como "já salvo" um item deste ciclo que nunca
 * foi tocado nele.
 */
export async function listarRascunhosConciliacaoLaquila(
  importacaoId: string,
  codigosFornecedor?: string[],
): Promise<RascunhoConciliacaoLaquila[]> {
  if (codigosFornecedor && codigosFornecedor.length === 0) return [];
  try {
    const linhas = await db
      .select({
        id: produtoRascunhosTable.id,
        fornecedorId: produtoRascunhosTable.fornecedorId,
        codigoFornecedor: produtoRascunhosTable.codigoFornecedor,
        nome: produtoRascunhosTable.nome,
        descricao: produtoRascunhosTable.descricao,
        categoriaId: produtoRascunhosTable.categoriaId,
        categoriaNome: categoryTable.name,
        marcaId: produtoRascunhosTable.marcaId,
        marcaNome: marcaTable.nome,
        ean: produtoRascunhosTable.ean,
        ncm: produtoRascunhosTable.ncm,
        precoFornecedor: produtoRascunhosTable.precoFornecedor,
        precoLoja: produtoRascunhosTable.precoLoja,
        estoqueFornecedor: produtoRascunhosTable.estoqueFornecedor,
        peso: produtoRascunhosTable.peso,
        altura: produtoRascunhosTable.altura,
        largura: produtoRascunhosTable.largura,
        comprimento: produtoRascunhosTable.comprimento,
        imagens: produtoRascunhosTable.imagens,
        dadosOrigemJson: produtoRascunhosTable.dadosOrigemJson,
        status: produtoRascunhosTable.status,
      })
      .from(produtoRascunhosTable)
      .leftJoin(
        categoryTable,
        eq(produtoRascunhosTable.categoriaId, categoryTable.id),
      )
      .leftJoin(marcaTable, eq(produtoRascunhosTable.marcaId, marcaTable.id))
      .where(
        and(
          eq(produtoRascunhosTable.origemTipo, "fornecedor_api"),
          eq(produtoRascunhosTable.origemProvedor, PROVEDOR_INTEGRACAO_LAQUILA),
          inArray(produtoRascunhosTable.status, [
            "rascunho",
            "pendente_conciliacao",
            "pronto_para_publicar",
          ]),
          sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${importacaoId}`,
          ...(codigosFornecedor
            ? [
                inArray(
                  produtoRascunhosTable.codigoFornecedor,
                  codigosFornecedor,
                ),
              ]
            : []),
        ),
      );

    const fornecedoresIds = Array.from(
      new Set(
        linhas
          .map((linha) => linha.fornecedorId)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const vinculosAtivos =
      fornecedoresIds.length > 0
        ? await db
            .select({
              fornecedorId: fornecedorProdutoVinculosTable.fornecedorId,
              codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
            })
            .from(fornecedorProdutoVinculosTable)
            .where(
              and(
                inArray(
                  fornecedorProdutoVinculosTable.fornecedorId,
                  fornecedoresIds,
                ),
                eq(fornecedorProdutoVinculosTable.status, "ativo"),
              ),
            )
        : [];
    const publicados = new Set(
      vinculosAtivos.map(
        (vinculo) =>
          `${vinculo.fornecedorId}:${vinculo.codigoFornecedor ?? ""}`,
      ),
    );

    return linhas
      .filter(
        (linha) =>
          !linha.fornecedorId ||
          !publicados.has(
            `${linha.fornecedorId}:${linha.codigoFornecedor ?? ""}`,
          ),
      )
      .map(({ dadosOrigemJson, fornecedorId: _fornecedorId, ...linha }) => ({
        ...linha,
        imagens: linha.imagens ?? [],
        secoesLoja: extrairSecoesLojaRascunhoFornecedor(dadosOrigemJson),
        configuracaoComercial:
          extrairConfiguracaoComercialRascunhoFornecedor(dadosOrigemJson),
      }));
  } catch (erro) {
    console.error("[listarRascunhosConciliacaoLaquila]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return [];
  }
}
