import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutosStagingTable,
  importacoesFornecedorTable,
} from "@/db/schema";

import {
  itemRevisaoImportacaoFornecedorSchema,
  resumoRevisaoImportacaoFornecedorSchema,
} from "../schemas/fornecedores.schema";
import type {
  CampoProblemaRevisaoFornecedor,
  CodigoProblemaRevisaoFornecedor,
  ItemRevisaoImportacaoFornecedor,
  ProblemaRevisaoFornecedor,
  ResultadoRevisaoImportacaoFornecedor,
} from "../types/fornecedores.types";

function temTexto(valor: string | null | undefined) {
  return Boolean(valor && valor.trim().length > 0);
}

function normalizarPreco(valor: string | null | undefined) {
  if (!temTexto(valor)) return null;

  const texto = valor!.replace(/\s/g, "").replace(/^R\$/i, "");
  const ultimoPonto = texto.lastIndexOf(".");
  const ultimaVirgula = texto.lastIndexOf(",");
  const temPonto = ultimoPonto >= 0;
  const temVirgula = ultimaVirgula >= 0;
  const separadorDecimal =
    temPonto && temVirgula
      ? ultimoPonto > ultimaVirgula
        ? "."
        : ","
      : temVirgula
        ? ","
        : ".";

  const normalizado =
    separadorDecimal === ","
      ? texto.replace(/\./g, "").replace(",", ".")
      : texto.replace(/,/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;

  return Number(normalizado);
}

function criarProblema(
  codigo: CodigoProblemaRevisaoFornecedor,
  campo: CampoProblemaRevisaoFornecedor,
  mensagem: string,
): ProblemaRevisaoFornecedor {
  return { codigo, campo, mensagem };
}

function valorTextoBruto(
  dados: Record<string, string | number | boolean | Date | null>,
  chaves: string[],
) {
  for (const chave of chaves) {
    const texto = String(dados[chave] ?? "").trim();
    if (texto.length > 0) return texto;
  }

  return null;
}

export async function analisarRevisaoImportacaoFornecedor(
  importacaoId: string,
): Promise<ResultadoRevisaoImportacaoFornecedor> {
  const [importacao] = await db
    .select({ id: importacoesFornecedorTable.id })
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
      dadosBrutos: fornecedorProdutosStagingTable.dadosBrutos,
      nomeProduto: fornecedorProdutosStagingTable.nomeProduto,
      categoriaFornecedor: fornecedorProdutosStagingTable.categoriaFornecedor,
      marcaFornecedor: fornecedorProdutosStagingTable.marcaFornecedor,
      precoFornecedor: fornecedorProdutosStagingTable.precoFornecedor,
    })
    .from(fornecedorProdutosStagingTable)
    .where(eq(fornecedorProdutosStagingTable.importacaoId, importacaoId));

  const resumo = {
    totalImportado: linhas.length,
    totalSemCodigo: 0,
    totalSemCategoria: 0,
    totalSemNome: 0,
    totalSemMarca: 0,
    totalPrecoInvalido: 0,
    totalProdutosOK: 0,
    totalComProblema: 0,
  };

  const itens = linhas
    .map((linha) => {
      const problemas: ProblemaRevisaoFornecedor[] = [];

      if (!temTexto(linha.codigoFornecedor)) {
        problemas.push(
          criarProblema(
            "sem_codigo",
            "codigoFornecedor",
            "Produto sem código do fornecedor.",
          ),
        );
        resumo.totalSemCodigo += 1;
      }

      if (!temTexto(linha.categoriaFornecedor)) {
        problemas.push(
          criarProblema(
            "sem_categoria",
            "categoriaFornecedor",
            "Produto sem categoria.",
          ),
        );
        resumo.totalSemCategoria += 1;
      }

      if (!temTexto(linha.nomeProduto)) {
        problemas.push(
          criarProblema("sem_nome", "nomeProduto", "Produto sem nome."),
        );
        resumo.totalSemNome += 1;
      }

      if (!temTexto(linha.marcaFornecedor)) {
        problemas.push(
          criarProblema("sem_marca", "marcaFornecedor", "Produto sem marca."),
        );
        resumo.totalSemMarca += 1;
      }

      if (normalizarPreco(linha.precoFornecedor) === null) {
        problemas.push(
          criarProblema(
            "preco_invalido",
            "precoFornecedor",
            "Preço inválido.",
          ),
        );
        resumo.totalPrecoInvalido += 1;
      }

      if (problemas.length === 0) {
        resumo.totalProdutosOK += 1;
        return null;
      }

      resumo.totalComProblema += 1;

      return itemRevisaoImportacaoFornecedorSchema.parse({
        stagingId: linha.id,
        codigoFornecedor: linha.codigoFornecedor,
        sku: valorTextoBruto(
          linha.dadosBrutos as Record<string, string | number | boolean | Date | null>,
          ["sku", "SKU", "codigo_sku", "codigoSKU", "referencia"],
        ),
        nomeProduto: linha.nomeProduto,
        categoriaFornecedor: linha.categoriaFornecedor,
        marcaFornecedor: linha.marcaFornecedor,
        precoFornecedor: linha.precoFornecedor,
        problemas,
        status: "com_problema",
      });
    })
    .filter(
      (item): item is ItemRevisaoImportacaoFornecedor => item !== null,
    );

  return {
    importacaoId,
    resumo: resumoRevisaoImportacaoFornecedorSchema.parse(resumo),
    itens,
  };
}
