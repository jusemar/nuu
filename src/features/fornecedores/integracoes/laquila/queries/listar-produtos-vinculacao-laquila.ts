import "server-only";

import { and, asc, count, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutosApiStagingTable } from "@/db/schema";
import {
  calcularPaginacaoFornecedores,
  normalizarLimiteFornecedores,
  offsetInicialFornecedores,
  type PaginacaoFornecedores,
} from "@/features/fornecedores/lib/paginacao-fornecedores";
import type { EstagioVinculacaoFornecedor } from "@/features/fornecedores/queries/listar-staging-importacao-fornecedor-admin";

export type ProdutoVinculacaoLaquila = {
  cd_item: string;
  descricao: string;
  cd_ean: string;
  NCM: string;
  ds_ggrupo: string;
  ds_grupo: string;
  ds_sgrupo: string;
  lista_fotos: unknown;
  vl_preco: string | number | null;
  qt_saldo: string | number | null;
  peso_bruto: string;
  altura_caixa: string;
  largura_caixa: string;
  comprimento_caixa: string;
  estagio: EstagioVinculacaoFornecedor;
};

/**
 * Página real da Vinculação Laquila.
 *
 * O estágio usa os mesmos sinais do fluxo por arquivo: decisão explícita no
 * rascunho, vínculo permanente e terminais da execução. Nenhum JSON completo
 * é carregado fora dos 25/50/100 itens da página solicitada.
 */
export async function listarProdutosVinculacaoLaquila({
  importacaoId,
  fornecedorId,
  pagina,
  limite,
  busca,
  estagio,
}: {
  importacaoId: string;
  fornecedorId: string | null;
  pagina?: number | string | null;
  limite?: number | string | null;
  busca?: string;
  estagio?: EstagioVinculacaoFornecedor;
}): Promise<{
  produtos: ProdutoVinculacaoLaquila[];
  paginacao: PaginacaoFornecedores;
}> {
  const limiteNormalizado = normalizarLimiteFornecedores(limite);
  const offsetInicial = offsetInicialFornecedores(pagina, limite);
  const termo = busca?.trim();
  // Não interpolar `fornecedorId` nulo em `is not null`: o PostgreSQL não
  // consegue inferir o tipo desse parâmetro dentro do CASE. A existência do
  // fornecedor é decidida no TypeScript e o trecho SQL só é emitido quando há
  // uma identidade válida para consultar os vínculos ativos.
  const estagioVinculado = fornecedorId
    ? sql`when exists (
        select 1 from fornecedor_produto_vinculos v
         where v.fornecedor_id = ${fornecedorId}
           and btrim(v.codigo_fornecedor) = btrim("fornecedor_produtos_api_staging"."codigo_fornecedor")
           and v.status = 'ativo'
      ) then 'vinculado'`
    : sql``;
  const estagioSql = sql<EstagioVinculacaoFornecedor>`case
    when exists (
      select 1 from produto_rascunhos pr
       where pr.dados_origem_json->'origemFluxoFornecedor'->>'importacaoId' = ${importacaoId}
         and btrim(pr.codigo_fornecedor) = btrim("fornecedor_produtos_api_staging"."codigo_fornecedor")
         and pr.status = 'publicado'
    ) then 'publicado'
    when ${fornecedorProdutosApiStagingTable.status} = 'ignorado' then 'ignorado'
    when exists (
      select 1 from produto_rascunhos pr
       where pr.dados_origem_json->'origemFluxoFornecedor'->>'importacaoId' = ${importacaoId}
         and btrim(pr.codigo_fornecedor) = btrim("fornecedor_produtos_api_staging"."codigo_fornecedor")
         and pr.produto_atualizado_id is null
         and pr.status <> 'publicado'
    ) then 'novo'
    ${estagioVinculado}
    else 'pendente'
  end`;
  const condicoes = and(
    eq(fornecedorProdutosApiStagingTable.importacaoId, importacaoId),
    // A tela não pode inferir o lote da página atual nem exibir toda a
    // importação: só entram os itens explicitamente encaminhados no
    // Mapeamento desta execução.
    sql`${fornecedorProdutosApiStagingTable.dadosBrutosJson}->>'selecionadoParaFluxo' = 'true'`,
    ...(termo
      ? [
          or(
            ilike(fornecedorProdutosApiStagingTable.nomeProduto, `%${termo}%`),
            ilike(
              fornecedorProdutosApiStagingTable.codigoFornecedor,
              `%${termo}%`,
            ),
          )!,
        ]
      : []),
    ...(estagio ? [sql`${estagioSql} = ${estagio}`] : []),
  );

  const listarPagina = (offset: number) =>
    db
      .select({
        codigo: fornecedorProdutosApiStagingTable.codigoFornecedor,
        nome: fornecedorProdutosApiStagingTable.nomeProduto,
        ean: fornecedorProdutosApiStagingTable.ean,
        ncm: fornecedorProdutosApiStagingTable.ncm,
        preco: fornecedorProdutosApiStagingTable.precoFornecedor,
        estoque: fornecedorProdutosApiStagingTable.estoqueFornecedor,
        dados: fornecedorProdutosApiStagingTable.dadosBrutosJson,
        estagio: estagioSql,
      })
      .from(fornecedorProdutosApiStagingTable)
      .where(condicoes)
      .orderBy(asc(fornecedorProdutosApiStagingTable.criadoEm))
      .limit(limiteNormalizado)
      .offset(offset);

  const [linhasIniciais, [{ total } = { total: 0 }]] = await Promise.all([
    listarPagina(offsetInicial),
    db
      .select({ total: count() })
      .from(fornecedorProdutosApiStagingTable)
      .where(condicoes),
  ]);
  const paginacao = calcularPaginacaoFornecedores({
    pagina,
    limite,
    total: Number(total),
  });
  const linhas =
    paginacao.offset === offsetInicial
      ? linhasIniciais
      : await listarPagina(paginacao.offset);

  return {
    paginacao,
    produtos: linhas.map((linha) => {
      const dados =
        linha.dados &&
        typeof linha.dados === "object" &&
        !Array.isArray(linha.dados)
          ? (linha.dados as Record<string, unknown>)
          : {};
      const texto = (chave: string) =>
        typeof dados[chave] === "string" ? dados[chave].trim() : "";

      return {
        cd_item: linha.codigo,
        descricao: linha.nome,
        cd_ean: linha.ean ?? "",
        NCM: linha.ncm ?? "",
        ds_ggrupo: texto("ds_ggrupo"),
        ds_grupo: texto("ds_grupo"),
        ds_sgrupo: texto("ds_sgrupo"),
        lista_fotos: dados.lista_fotos,
        vl_preco: linha.preco === null ? null : String(linha.preco),
        qt_saldo: linha.estoque,
        peso_bruto: texto("peso_bruto"),
        altura_caixa: texto("altura_caixa"),
        largura_caixa: texto("largura_caixa"),
        comprimento_caixa: texto("comprimento_caixa"),
        estagio: linha.estagio,
      };
    }),
  };
}
