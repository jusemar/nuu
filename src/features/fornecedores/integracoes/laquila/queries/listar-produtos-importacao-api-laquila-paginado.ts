import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { db } from "@/db/connection";
import { fornecedorProdutosApiStagingTable } from "@/db/schema";
import {
  calcularPaginacaoFornecedores,
  normalizarLimiteFornecedores,
  normalizarPaginaFornecedores,
  offsetInicialFornecedores,
} from "@/features/fornecedores/lib/paginacao-fornecedores";

import type { ImportacaoApiLaquila } from "./buscar-importacao-api-laquila";
import type { ProdutoApiStagingLaquilaCatalogo } from "./listar-produtos-api-staging-laquila";

export const ORDENACOES_PRODUTOS_LAQUILA = [
  "recentes",
  "antigos",
  "preco-asc",
  "preco-desc",
  "estoque-asc",
  "estoque-desc",
  "nome-asc",
  "nome-desc",
] as const;

export type OrdenacaoProdutosLaquila =
  (typeof ORDENACOES_PRODUTOS_LAQUILA)[number];
export type FiltroEstoqueProdutosLaquila = "todos" | "com" | "sem";

export type FiltrosProdutosImportacaoLaquila = {
  busca?: string;
  estoque?: FiltroEstoqueProdutosLaquila;
  precoMinimo?: number | null;
  precoMaximo?: number | null;
  grupo?: string;
  subgrupo?: string;
  marca?: string;
  situacao?: "novo" | "vinculado" | "atencao" | "ignorado" | "";
  ordem?: OrdenacaoProdutosLaquila;
  pagina?: number | string | null;
  limite?: number | string | null;
};

type LinhaProduto = typeof fornecedorProdutosApiStagingTable.$inferSelect;

function converterProduto(
  produto: LinhaProduto,
): ProdutoApiStagingLaquilaCatalogo {
  const bruto = produto.dadosBrutosJson ?? {};
  const fotos = bruto.lista_fotos;
  const imagem = Array.isArray(fotos)
    ? fotos.map(String).find((item) => item.trim())
    : typeof fotos === "string"
      ? fotos.split(/[\n,;|]+/).find((item) => item.trim())
      : null;

  return {
    id: produto.id,
    codigo: produto.codigoFornecedor,
    nome: produto.nomeProduto,
    marca: produto.marcaFornecedor ?? "Sem marca",
    grupo: produto.grupoFornecedor ?? "Sem grupo",
    categoria: produto.subgrupoFornecedor ?? produto.grupoFornecedor ?? "API",
    ean: produto.ean ?? "-",
    ncm: produto.ncm ?? "-",
    preco:
      produto.precoFornecedor === null ? null : Number(produto.precoFornecedor),
    estoque: produto.estoqueFornecedor,
    status: produto.status,
    imagemUrl: imagem?.trim() || produto.imagemUrl || "",
    recebidoEm: produto.ultimaConsultaEm,
    dadosBrutosJson: bruto,
  };
}

function ordenarPor(ordem: OrdenacaoProdutosLaquila) {
  const tabela = fornecedorProdutosApiStagingTable;
  switch (ordem) {
    case "antigos":
      return [asc(tabela.ultimaConsultaEm), asc(tabela.id)];
    case "preco-asc":
      return [
        asc(tabela.precoFornecedor),
        asc(tabela.nomeProduto),
        asc(tabela.id),
      ];
    case "preco-desc":
      return [
        sql`${tabela.precoFornecedor} desc nulls last`,
        asc(tabela.nomeProduto),
        asc(tabela.id),
      ];
    case "estoque-asc":
      return [
        asc(tabela.estoqueFornecedor),
        asc(tabela.nomeProduto),
        asc(tabela.id),
      ];
    case "estoque-desc":
      return [
        sql`${tabela.estoqueFornecedor} desc nulls last`,
        asc(tabela.nomeProduto),
        asc(tabela.id),
      ];
    case "nome-asc":
      return [asc(tabela.nomeProduto), asc(tabela.id)];
    case "nome-desc":
      return [desc(tabela.nomeProduto), asc(tabela.id)];
    default:
      return [desc(tabela.ultimaConsultaEm), asc(tabela.id)];
  }
}

export async function listarProdutosImportacaoApiLaquilaPaginado(
  importacao: ImportacaoApiLaquila,
  filtros: FiltrosProdutosImportacaoLaquila,
) {
  const tabela = fornecedorProdutosApiStagingTable;
  const pagina = normalizarPaginaFornecedores(filtros.pagina);
  const limite = normalizarLimiteFornecedores(filtros.limite);
  const busca = filtros.busca?.trim();
  const condicoes: SQL[] = [eq(tabela.importacaoId, importacao.id)];

  if (busca) {
    const termo = `%${busca}%`;
    condicoes.push(
      or(
        ilike(tabela.nomeProduto, termo),
        ilike(tabela.codigoFornecedor, termo),
        ilike(tabela.ncm, termo),
      )!,
    );
  }
  if (filtros.estoque === "com")
    condicoes.push(gte(tabela.estoqueFornecedor, 1));
  if (filtros.estoque === "sem")
    condicoes.push(eq(tabela.estoqueFornecedor, 0));
  if (filtros.precoMinimo != null)
    condicoes.push(gte(tabela.precoFornecedor, String(filtros.precoMinimo)));
  if (filtros.precoMaximo != null)
    condicoes.push(lte(tabela.precoFornecedor, String(filtros.precoMaximo)));
  if (filtros.grupo) condicoes.push(eq(tabela.grupoFornecedor, filtros.grupo));
  if (filtros.subgrupo)
    condicoes.push(eq(tabela.subgrupoFornecedor, filtros.subgrupo));
  if (filtros.marca) condicoes.push(eq(tabela.marcaFornecedor, filtros.marca));
  if (filtros.situacao) condicoes.push(eq(tabela.status, filtros.situacao));

  const where = and(...condicoes);
  const [{ total }] = await db
    .select({ total: count() })
    .from(tabela)
    .where(where);
  const paginacao = calcularPaginacaoFornecedores({ pagina, limite, total });
  const offset = offsetInicialFornecedores(paginacao.pagina, paginacao.limite);
  const ordem = filtros.ordem ?? "recentes";
  const linhas = await db
    .select()
    .from(tabela)
    .where(where)
    .orderBy(...ordenarPor(ordem))
    .limit(paginacao.limite)
    .offset(offset);

  const distintos = async (coluna: AnyPgColumn) =>
    db
      .select({ valor: coluna })
      .from(tabela)
      .where(
        and(eq(tabela.importacaoId, importacao.id), sql`${coluna} is not null`),
      )
      .groupBy(coluna)
      .orderBy(asc(coluna));
  const [grupos, subgrupos, marcas] = await Promise.all([
    distintos(tabela.grupoFornecedor),
    distintos(tabela.subgrupoFornecedor),
    distintos(tabela.marcaFornecedor),
  ]);

  return {
    produtos: linhas.map(converterProduto),
    paginacao,
    opcoes: {
      grupos: grupos.flatMap(({ valor }) => (valor ? [valor] : [])),
      subgrupos: subgrupos.flatMap(({ valor }) => (valor ? [valor] : [])),
      marcas: marcas.flatMap(({ valor }) => (valor ? [valor] : [])),
    },
  };
}
