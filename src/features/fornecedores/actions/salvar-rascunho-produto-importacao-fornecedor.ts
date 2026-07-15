"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/connection";
import {
  fornecedorProdutosStagingTable,
  importacoesFornecedorTable,
} from "@/db/schema";
import { adaptarLinhaStagingExcelParaProdutoRecebido } from "@/features/fornecedores/lib/adaptadores/adaptar-linha-staging-excel-produto-recebido-fornecedor";
import { prepararRascunhoProdutoRecebidoFornecedor } from "@/features/fornecedores/lib/adaptadores/preparar-rascunho-produto-recebido-fornecedor";
import { extrairConfiguracaoComercialRascunhoFornecedor } from "@/features/fornecedores/lib/conciliacao/configuracao-rascunho-fornecedor";
import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { salvarProdutoRascunhoFornecedor } from "@/features/fornecedores/services/salvar-produto-rascunho-fornecedor.service";
import type { ConfiguracaoComercialMapeamentoFornecedor } from "@/features/fornecedores/types/mapeamento-fornecedor.types";

const salvarRascunhoProdutoImportacaoFornecedorSchema = z.object({
  item: z.object({ id: z.uuid() }),
  produto: z.record(z.string(), z.unknown()),
});

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function obterTexto(registro: Record<string, unknown>, chave: string) {
  const valor = registro[chave];

  if (typeof valor === "string") return valor.trim();
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);

  return "";
}

function obterValorPadrao(
  configuracao: Record<string, unknown>,
  campoDestino: string,
) {
  const regras = Array.isArray(configuracao.regras) ? configuracao.regras : [];
  const regra = regras.find(
    (item) =>
      ehRegistro(item) &&
      item.campoDestino === campoDestino &&
      item.estrategia === "valor_padrao_todos",
  );

  return ehRegistro(regra) ? obterTexto(regra, "valorPadraoId") : "";
}

function obterPrecoProduto(produto: Record<string, unknown>) {
  const pricing = produto.pricing;
  if (!ehRegistro(pricing)) return "";

  const modalidades = pricing.modalities;
  const modalidade = obterTexto(pricing, "mainCardPriceType");
  const chaves = Array.from(
    new Set([
      modalidade,
      modalidade === "pre_sale" ? "preSale" : "",
      modalidade === "order_basis" ? "orderBasis" : "",
      "dropshipping",
      "stock",
      "preSale",
      "orderBasis",
    ]),
  ).filter(Boolean);

  if (ehRegistro(modalidades)) {
    for (const chave of chaves) {
      const dadosModalidade = modalidades[chave];
      if (!ehRegistro(dadosModalidade)) continue;

      const preco = obterTexto(dadosModalidade, "price");
      if (preco) return preco;
    }
  }

  return obterTexto(pricing, "costPrice");
}

function obterSecoesProduto(produto: Record<string, unknown>) {
  return Array.isArray(produto.storeProductFlags)
    ? produto.storeProductFlags.filter(
        (item): item is string => typeof item === "string" && Boolean(item),
      )
    : [];
}

function obterConfiguracaoComercial(
  produto: Record<string, unknown>,
  configuracaoFluxo: Record<string, unknown>,
): ConfiguracaoComercialMapeamentoFornecedor | undefined {
  const pricing = ehRegistro(produto.pricing) ? produto.pricing : null;
  const configuracaoProduto = pricing?.configuracaoMapeamentoComercial;
  const origem = ehRegistro(configuracaoProduto)
    ? { configuracaoComercial: configuracaoProduto }
    : configuracaoFluxo;
  const configuracao = extrairConfiguracaoComercialRascunhoFornecedor(origem);

  return configuracao.modalidade
    ? {
        modalidade: configuracao.modalidade,
        prazoEntrega: configuracao.prazoEntrega,
      }
    : undefined;
}

export async function salvarRascunhoProdutoImportacaoFornecedor(
  entrada: unknown,
) {
  const validacao =
    salvarRascunhoProdutoImportacaoFornecedorSchema.safeParse(entrada);

  if (!validacao.success) {
    return { sucesso: false, erro: "Dados inválidos para salvar o rascunho." };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão não está ativa. Entre novamente para salvar o rascunho.",
    };
  }

  try {
    const [linha] = await db
      .select({
        id: fornecedorProdutosStagingTable.id,
        importacaoId: fornecedorProdutosStagingTable.importacaoId,
        fornecedorId: importacoesFornecedorTable.fornecedorId,
        codigoFornecedor: fornecedorProdutosStagingTable.codigoFornecedor,
        nomeProduto: fornecedorProdutosStagingTable.nomeProduto,
        categoriaFornecedor: fornecedorProdutosStagingTable.categoriaFornecedor,
        marcaFornecedor: fornecedorProdutosStagingTable.marcaFornecedor,
        precoFornecedor: fornecedorProdutosStagingTable.precoFornecedor,
        precoOriginal: fornecedorProdutosStagingTable.precoOriginal,
        precoCalculado: fornecedorProdutosStagingTable.precoCalculado,
        estoqueFornecedor: fornecedorProdutosStagingTable.estoqueFornecedor,
        status: fornecedorProdutosStagingTable.status,
        errosValidacao: fornecedorProdutosStagingTable.errosValidacao,
        dadosBrutos: fornecedorProdutosStagingTable.dadosBrutos,
        configuracaoFluxoJson: importacoesFornecedorTable.configuracaoFluxoJson,
      })
      .from(fornecedorProdutosStagingTable)
      .innerJoin(
        importacoesFornecedorTable,
        eq(
          importacoesFornecedorTable.id,
          fornecedorProdutosStagingTable.importacaoId,
        ),
      )
      .where(eq(fornecedorProdutosStagingTable.id, validacao.data.item.id))
      .limit(1);

    if (!linha) {
      return { sucesso: false, erro: "Item da importação não encontrado." };
    }

    const produto = validacao.data.produto;
    const configuracaoFluxo = linha.configuracaoFluxoJson ?? {};
    const itemRecebido = adaptarLinhaStagingExcelParaProdutoRecebido({
      ...linha,
      dadosBrutos: linha.dadosBrutos as Record<string, unknown>,
    });
    const categoriaId =
      obterTexto(produto, "categoryId") ||
      obterValorPadrao(configuracaoFluxo, "categoria_fornecedor") ||
      null;
    const marcaId =
      obterTexto(produto, "brandId") ||
      obterValorPadrao(configuracaoFluxo, "marca_fornecedor") ||
      null;
    const configuracaoComercial = obterConfiguracaoComercial(
      produto,
      configuracaoFluxo,
    );
    const rascunhoPreparado = prepararRascunhoProdutoRecebidoFornecedor(
      itemRecebido,
      {
        categoriaId,
        marcaId,
        precoLoja: obterPrecoProduto(produto) || linha.precoCalculado,
        secoesLoja: obterSecoesProduto(produto),
        configuracaoComercial,
      },
    );
    const { pendencias: _pendencias, ...dadosPersistencia } = rascunhoPreparado;
    const nome = obterTexto(produto, "name") || rascunhoPreparado.nome;
    const descricao =
      obterTexto(produto, "description") || rascunhoPreparado.descricao;
    const salvo = await salvarProdutoRascunhoFornecedor({
      ...dadosPersistencia,
      nome,
      descricao,
      dadosOrigemJson: {
        ...rascunhoPreparado.dadosOrigemJson,
        produtoRascunho: produto,
        configuracaoFluxoImportacao: configuracaoFluxo,
      },
    });

    revalidatePath(`/admin/fornecedores/importacoes/${linha.importacaoId}`);

    return {
      sucesso: true,
      mensagem: "Rascunho salvo. Revise este produto na Conciliação.",
      rascunhoId: salvo.id,
      rascunho: {
        id: salvo.id,
        nome,
        categoriaId,
        marcaId,
        categoriaNome: categoriaId,
        marcaNome: obterTexto(produto, "brand") || marcaId,
        precoLoja: rascunhoPreparado.precoLoja,
      },
    };
  } catch (erro) {
    console.error("[salvarRascunhoProdutoImportacaoFornecedor]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro: "Não foi possível salvar o rascunho do produto.",
    };
  }
}
