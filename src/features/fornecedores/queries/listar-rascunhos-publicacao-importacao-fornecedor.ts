import "server-only";

import { and, asc, count, eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  categoryTable,
  marcaTable,
  productTable,
  produtoRascunhosTable,
} from "@/db/schema";
import type { RascunhoPublicacaoFornecedor } from "@/features/fornecedores/components/admin/pagina-publicacao-fornecedor-admin";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";
import {
  ORIGEM_IMPORTACAO_ARQUIVO,
  type OrigemImportacaoFornecedor,
} from "@/features/fornecedores/lib/origem-importacao-fornecedor";
import {
  calcularPaginacaoFornecedores,
  normalizarLimiteFornecedores,
  offsetInicialFornecedores,
  type PaginacaoFornecedores,
} from "@/features/fornecedores/lib/paginacao-fornecedores";

import { buscarOrigemImportacaoFornecedor } from "./buscar-origem-importacao-fornecedor";

/**
 * Itens aprovados de UMA importação, prontos para virar produto da loja.
 *
 * Consulta própria, e não uma fatia da query da Conciliação.
 *
 * Antes esta função delegava para `listarRascunhosImportacaoFornecedor` e
 * descartava 25 dos 35 campos que ela devolve. Isso custava, a cada abertura da
 * tela: dois `leftJoin` extras para o retrato atual da loja, um `leftJoin` de
 * preço vigente, uma varredura de TODAS as variantes dos produtos vinculados
 * (para calcular um estoque que esta tela não mostra) e uma leitura de vínculos
 * ativos (para um filtro que o próprio `pronto_para_publicar` já garante) — três
 * idas e voltas de rede, no driver HTTP, para dados jogados fora.
 *
 * Aqui é uma consulta só, com o filtro de status aplicado no SQL em vez de em
 * JavaScript.
 */
export async function listarRascunhosPublicacaoImportacaoFornecedor(
  importacaoId: string,
  origemInformada?: OrigemImportacaoFornecedor,
  paginacao?: { pagina?: number | string | null; limite?: number | string | null },
): Promise<{
  rascunhos: RascunhoPublicacaoFornecedor[];
  paginacao: PaginacaoFornecedores;
}> {
  const origem =
    origemInformada ??
    (await buscarOrigemImportacaoFornecedor(importacaoId)) ??
    ORIGEM_IMPORTACAO_ARQUIVO;

  const limite = normalizarLimiteFornecedores(paginacao?.limite);
  const offset = offsetInicialFornecedores(paginacao?.pagina, paginacao?.limite);

  const condicoes = and(
    eq(produtoRascunhosTable.origemTipo, origem.origemTipo),
    eq(produtoRascunhosTable.origemProvedor, origem.origemProvedor),
    // O portão da etapa, aplicado no banco: só item aprovado chega aqui.
    eq(produtoRascunhosTable.status, "pronto_para_publicar"),
    sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${importacaoId}`,
    /**
     * Item "criar produto novo" que já virou produto não volta para a fila.
     *
     * Antes da publicação passar a marcar `publicado` também no caminho
     * "criar", o único sinal de que o item já tinha virado produto era o
     * vínculo ativo. Rascunhos daquela época seguem `pronto_para_publicar` no
     * banco — medido em desenvolvimento: 104 numa única importação, todos com
     * vínculo ativo. Sem esta condição, a tela os ofereceria de novo e cada
     * tentativa morreria em "Este rascunho já foi publicado".
     *
     * O caminho "atualizar" fica de fora da regra de propósito: ele nasce com
     * vínculo ativo desde a Vinculação, e é o `status` que diz se já publicou.
     */
    sql`(
      ${produtoRascunhosTable.produtoAtualizadoId} is not null
      or ${produtoRascunhosTable.fornecedorId} is null
      or not exists (
        select 1
          from fornecedor_produto_vinculos v
         where v.fornecedor_id = ${produtoRascunhosTable.fornecedorId}
           and v.codigo_fornecedor = ${produtoRascunhosTable.codigoFornecedor}
           and v.status = 'ativo'
      )
    )`,
  );

  // Página e contagem saem juntas na mesma leitura protegida: uma retentativa
  // que refizesse só a contagem devolveria um total que não corresponde às
  // linhas exibidas.
  const [linhas, totalLinhas] = await executarLeituraFornecedores(
    {
      etapa: "publicacao:listar-rascunhos",
      importacaoId,
      mensagemAmigavel:
        "Não foi possível carregar os itens aprovados para publicação. Tente novamente em alguns segundos.",
    },
    () =>
      Promise.all([
        db
          .select({
            id: produtoRascunhosTable.id,
            codigoFornecedor: produtoRascunhosTable.codigoFornecedor,
            fornecedorId: produtoRascunhosTable.fornecedorId,
            nome: produtoRascunhosTable.nome,
            categoriaNome: categoryTable.name,
            marcaNome: marcaTable.nome,
            precoLoja: produtoRascunhosTable.precoLoja,
            estoqueFornecedor: produtoRascunhosTable.estoqueFornecedor,
            imagens: produtoRascunhosTable.imagens,
            produtoAtualizadoId: produtoRascunhosTable.produtoAtualizadoId,
            produtoAtualizadoNome: productTable.name,
          })
          .from(produtoRascunhosTable)
          .leftJoin(
            categoryTable,
            eq(produtoRascunhosTable.categoriaId, categoryTable.id),
          )
          .leftJoin(marcaTable, eq(produtoRascunhosTable.marcaId, marcaTable.id))
          .leftJoin(
            productTable,
            eq(productTable.id, produtoRascunhosTable.produtoAtualizadoId),
          )
          .where(condicoes)
          .orderBy(asc(produtoRascunhosTable.criadoEm))
          .limit(limite)
          .offset(offset),
        db
          .select({ total: count() })
          .from(produtoRascunhosTable)
          .where(condicoes),
      ]),
  );

  const total = Number(totalLinhas[0]?.total ?? 0);

  return {
    rascunhos: linhas
      .filter(
        (linha) =>
          Boolean(linha.fornecedorId) && Boolean(linha.codigoFornecedor?.trim()),
      )
      .map((linha) => {
        const temPreco =
          Boolean(linha.precoLoja) && Number(linha.precoLoja) > 0;

        return {
          id: linha.id,
          codigoFornecedor: linha.codigoFornecedor,
          nome: linha.nome,
          categoriaNome: linha.categoriaNome,
          marcaNome: linha.marcaNome,
          precoLoja: linha.precoLoja,
          estoqueFornecedor: linha.estoqueFornecedor,
          imagemUrl: linha.imagens?.[0] ?? null,
          // Preço é a única exigência do caminho "atualizar"; o "criar" já teve
          // as suas verificadas na Conciliação para chegar a aprovado.
          pronto: temPreco,
          pendencias: temPreco ? [] : ["Preço da loja"],
          produtoAtualizadoId: linha.produtoAtualizadoId,
          produtoAtualizadoNome: linha.produtoAtualizadoNome,
        };
      }),
    // O clamp evita a "página vazia": publicar os itens da última página
    // encolhe o total, e o gestor voltaria para uma tela em branco.
    paginacao: calcularPaginacaoFornecedores({
      pagina: paginacao?.pagina,
      limite: paginacao?.limite,
      total,
    }),
  };
}
