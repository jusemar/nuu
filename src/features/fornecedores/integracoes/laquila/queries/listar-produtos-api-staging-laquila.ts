import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutosApiStagingTable } from "@/db/schema";
import type { StatusProdutoLaquilaMock } from "../types/produto-laquila-mock.types";
import { CLASSIFICACOES_RECEBIDOS_API_LAQUILA } from "../constants";

export type ProdutoApiStagingLaquilaPrevia = {
  id: string;
  codigo: string;
  nome: string;
  marca: string | null;
  ean: string | null;
  ncm: string | null;
  ultimaConsultaEm: Date;
};

export type ProdutoApiStagingLaquilaCatalogo = {
  id: string;
  codigo: string;
  nome: string;
  marca: string;
  grupo: string;
  categoria: string;
  ean: string;
  ncm: string;
  preco: number | null;
  estoque: number | null;
  status: StatusProdutoLaquilaMock;
  imagemUrl: string;
  recebidoEm: Date;
  dadosBrutosJson: Record<string, unknown>;
};

function obterDadosBrutosComoObjeto(valor: unknown) {
  if (valor && typeof valor === "object" && !Array.isArray(valor)) {
    return valor as Record<string, unknown>;
  }

  return {};
}

function extrairPrimeiraFoto(valor: unknown) {
  if (Array.isArray(valor)) {
    return (
      valor
        .map((item) => String(item).trim())
        .find((item) => item.length > 0) ?? null
    );
  }

  if (typeof valor !== "string") return null;

  return (
    valor
      .split(/[\n,;|]+/)
      .map((item) => item.trim())
      .find((item) => item.length > 0) ?? null
  );
}

function normalizarClassificacao(valor: string | null | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

const classificacoesRecebidosPermitidas = new Set(
  CLASSIFICACOES_RECEBIDOS_API_LAQUILA.flatMap((classificacao) =>
    classificacao.subgrupos.map((subgrupo) =>
      [
        normalizarClassificacao(classificacao.macroGrupo),
        normalizarClassificacao(classificacao.grupo),
        normalizarClassificacao(subgrupo),
      ].join("|||"),
    ),
  ),
);

function obterTextoCampoBruto(
  dadosBrutosJson: Record<string, unknown>,
  campo: string,
) {
  const valor = dadosBrutosJson[campo];

  if (typeof valor === "string" && valor.trim()) {
    return valor.trim();
  }

  if (typeof valor === "number" && Number.isFinite(valor)) {
    return String(valor);
  }

  return "";
}

function produtoPertenceAoRecorteRecebidosLaquila(
  dadosBrutosJson: Record<string, unknown>,
) {
  const chave = [
    normalizarClassificacao(obterTextoCampoBruto(dadosBrutosJson, "ds_ggrupo")),
    normalizarClassificacao(obterTextoCampoBruto(dadosBrutosJson, "ds_grupo")),
    normalizarClassificacao(obterTextoCampoBruto(dadosBrutosJson, "ds_sgrupo")),
  ].join("|||");

  return classificacoesRecebidosPermitidas.has(chave);
}

export async function listarProdutosApiStagingLaquilaPrevia(
  integracaoId: string | null | undefined,
): Promise<ProdutoApiStagingLaquilaPrevia[]> {
  if (!integracaoId) return [];

  const produtos = await db
    .select({
      id: fornecedorProdutosApiStagingTable.id,
      codigo: fornecedorProdutosApiStagingTable.codigoFornecedor,
      nome: fornecedorProdutosApiStagingTable.nomeProduto,
      marca: fornecedorProdutosApiStagingTable.marcaFornecedor,
      ean: fornecedorProdutosApiStagingTable.ean,
      ncm: fornecedorProdutosApiStagingTable.ncm,
      ultimaConsultaEm: fornecedorProdutosApiStagingTable.ultimaConsultaEm,
    })
    .from(fornecedorProdutosApiStagingTable)
    .where(eq(fornecedorProdutosApiStagingTable.integracaoApiId, integracaoId))
    .orderBy(desc(fornecedorProdutosApiStagingTable.ultimaConsultaEm))
    .limit(10);

  return produtos;
}

export async function listarProdutosApiStagingLaquilaCatalogo(
  integracaoId: string | null | undefined,
): Promise<ProdutoApiStagingLaquilaCatalogo[]> {
  if (!integracaoId) return [];

  const produtos = await db
    .select({
      id: fornecedorProdutosApiStagingTable.id,
      codigo: fornecedorProdutosApiStagingTable.codigoFornecedor,
      nome: fornecedorProdutosApiStagingTable.nomeProduto,
      marca: fornecedorProdutosApiStagingTable.marcaFornecedor,
      grupo: fornecedorProdutosApiStagingTable.grupoFornecedor,
      subgrupo: fornecedorProdutosApiStagingTable.subgrupoFornecedor,
      ean: fornecedorProdutosApiStagingTable.ean,
      ncm: fornecedorProdutosApiStagingTable.ncm,
      preco: fornecedorProdutosApiStagingTable.precoFornecedor,
      estoque: fornecedorProdutosApiStagingTable.estoqueFornecedor,
      status: fornecedorProdutosApiStagingTable.status,
      imagemUrl: fornecedorProdutosApiStagingTable.imagemUrl,
      recebidoEm: fornecedorProdutosApiStagingTable.ultimaConsultaEm,
      dadosBrutosJson: fornecedorProdutosApiStagingTable.dadosBrutosJson,
    })
    .from(fornecedorProdutosApiStagingTable)
    .where(eq(fornecedorProdutosApiStagingTable.integracaoApiId, integracaoId))
    .orderBy(desc(fornecedorProdutosApiStagingTable.ultimaConsultaEm));

  return produtos.flatMap((produto) => {
    const dadosBrutosJson = obterDadosBrutosComoObjeto(produto.dadosBrutosJson);

    if (!produtoPertenceAoRecorteRecebidosLaquila(dadosBrutosJson)) {
      return [];
    }

    const imagemRecebida = extrairPrimeiraFoto(dadosBrutosJson.lista_fotos);

    return [
      {
        id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        marca: produto.marca ?? "Sem marca",
        grupo: produto.grupo ?? "Sem grupo",
        categoria: produto.subgrupo ?? produto.grupo ?? "API",
        ean: produto.ean ?? "-",
        ncm: produto.ncm ?? "-",
        preco: produto.preco === null ? null : Number(produto.preco),
        estoque: produto.estoque,
        status: produto.status,
        imagemUrl:
          imagemRecebida ?? produto.imagemUrl ?? "/produto-sem-foto.webp",
        recebidoEm: produto.recebidoEm,
        dadosBrutosJson,
      },
    ];
  });
}
