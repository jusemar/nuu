import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutosApiStagingTable } from "@/db/schema";
import type { StatusProdutoLaquilaMock } from "../types/produto-laquila-mock.types";

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
  preco: number;
  estoque: number;
  status: StatusProdutoLaquilaMock;
  imagemUrl: string;
};

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
    })
    .from(fornecedorProdutosApiStagingTable)
    .where(eq(fornecedorProdutosApiStagingTable.integracaoApiId, integracaoId))
    .orderBy(desc(fornecedorProdutosApiStagingTable.ultimaConsultaEm))
    .limit(100);

  return produtos.map((produto) => ({
    id: produto.id,
    codigo: produto.codigo,
    nome: produto.nome,
    marca: produto.marca ?? "Sem marca",
    grupo: produto.grupo ?? "Sem grupo",
    categoria: produto.subgrupo ?? produto.grupo ?? "API",
    ean: produto.ean ?? "-",
    ncm: produto.ncm ?? "-",
    preco: produto.preco ? Number(produto.preco) : 0,
    estoque: produto.estoque ?? 0,
    status: produto.status,
    imagemUrl: produto.imagemUrl ?? "/produto-sem-foto.webp",
  }));
}
