import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutosStagingTable,
  importacoesFornecedorTable,
  productPricingTable,
  productTable,
} from "@/db/schema";

import { previewSincronizacaoFornecedorSchema } from "../schemas/fornecedores.schema";
import type {
  ItemPreviewSincronizacaoFornecedor,
  PreviewSincronizacaoFornecedor,
  SituacaoPreviewSincronizacaoFornecedor,
} from "../types/fornecedores.types";
import { resumirPreviewImportacaoFornecedor } from "./resumir-preview-importacao.service";

type LinhaPreviewFornecedor = {
  stagingId: string;
  codigoFornecedor: string | null;
  nomeProdutoFornecedor: string;
  precoFornecedor: string | null;
  precoOriginal: string | null;
  precoCalculado: string | null;
  estoqueFornecedor: number | null;
  status: string;
  errosValidacao: Array<{ codigo: string; mensagem: string; campo?: string }>;
  produtoVinculadoId: string | null;
  produtoVinculadoNome: string | null;
  sku: string | null;
  precoAtualLojaEmCentavos: number | null;
};

function formatarDecimal(valor: number) {
  return valor.toFixed(2);
}

function normalizarPrecoDecimal(valor: string | null) {
  if (!valor) return null;

  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

function calcularPrecoImportacao(linha: LinhaPreviewFornecedor) {
  return (
    normalizarPrecoDecimal(linha.precoCalculado) ??
    normalizarPrecoDecimal(linha.precoOriginal) ??
    normalizarPrecoDecimal(linha.precoFornecedor)
  );
}

function montarItemPreview(
  linha: LinhaPreviewFornecedor,
): ItemPreviewSincronizacaoFornecedor {
  const precoImportacao = calcularPrecoImportacao(linha);
  const precoAtualLoja =
    linha.precoAtualLojaEmCentavos === null
      ? null
      : linha.precoAtualLojaEmCentavos / 100;
  const precoAtualLojaFormatado =
    precoAtualLoja === null ? null : formatarDecimal(precoAtualLoja);
  const precoImportacaoFormatado =
    precoImportacao === null ? null : formatarDecimal(precoImportacao);
  const diferencaPreco =
    precoImportacao !== null && precoAtualLoja !== null
      ? formatarDecimal(precoImportacao - precoAtualLoja)
      : null;

  let situacao: SituacaoPreviewSincronizacaoFornecedor;
  let erro: string | null = null;

  if (linha.status === "erro") {
    situacao = "bloqueado";
    erro = linha.errosValidacao[0]?.mensagem ?? "Item com erro no staging.";
  } else if (linha.status === "nao_localizado") {
    situacao = "pendente_vinculacao";
  } else if (
    linha.status === "localizado" &&
    linha.produtoVinculadoId &&
    precoImportacao !== null
  ) {
    situacao = "pronto_para_sincronizar";
  } else {
    situacao = "bloqueado";
    erro = "Dados mínimos insuficientes para sincronização futura.";
  }

  return {
    stagingId: linha.stagingId,
    codigoFornecedor: linha.codigoFornecedor,
    nomeProdutoFornecedor: linha.nomeProdutoFornecedor,
    produtoVinculadoId: linha.produtoVinculadoId,
    produtoVinculadoNome: linha.produtoVinculadoNome,
    sku: linha.sku,
    precoFornecedor: linha.precoFornecedor,
    precoCalculado: precoImportacaoFormatado,
    precoAtualLoja: precoAtualLojaFormatado,
    diferencaPreco,
    estoqueFornecedor: linha.estoqueFornecedor,
    situacao,
    erro,
  };
}

export async function gerarPreviewSincronizacaoFornecedor(
  entrada: unknown,
): Promise<PreviewSincronizacaoFornecedor> {
  const dados = previewSincronizacaoFornecedorSchema.parse(entrada);

  const [importacao] = await db
    .select({ id: importacoesFornecedorTable.id })
    .from(importacoesFornecedorTable)
    .where(eq(importacoesFornecedorTable.id, dados.importacaoId))
    .limit(1);

  if (!importacao) {
    throw new Error("Importação de fornecedor não encontrada.");
  }

  const linhas = await db
    .select({
      stagingId: fornecedorProdutosStagingTable.id,
      codigoFornecedor: fornecedorProdutosStagingTable.codigoFornecedor,
      nomeProdutoFornecedor: fornecedorProdutosStagingTable.nomeProduto,
      precoFornecedor: fornecedorProdutosStagingTable.precoFornecedor,
      precoOriginal: fornecedorProdutosStagingTable.precoOriginal,
      precoCalculado: fornecedorProdutosStagingTable.precoCalculado,
      estoqueFornecedor: fornecedorProdutosStagingTable.estoqueFornecedor,
      status: fornecedorProdutosStagingTable.status,
      errosValidacao: fornecedorProdutosStagingTable.errosValidacao,
      produtoVinculadoId: productTable.id,
      produtoVinculadoNome: productTable.name,
      sku: productTable.sku,
      precoAtualLojaEmCentavos: productPricingTable.price,
    })
    .from(fornecedorProdutosStagingTable)
    .leftJoin(
      productTable,
      eq(productTable.id, fornecedorProdutosStagingTable.produtoLocalizadoId),
    )
    .leftJoin(
      productPricingTable,
      and(
        eq(productPricingTable.productId, productTable.id),
        eq(productPricingTable.isActive, true),
        eq(productPricingTable.mainCardPrice, true),
      ),
    )
    .where(eq(fornecedorProdutosStagingTable.importacaoId, dados.importacaoId));

  const itens = linhas.map(montarItemPreview);

  return {
    importacaoId: dados.importacaoId,
    resumo: resumirPreviewImportacaoFornecedor(itens),
    itens,
  };
}
