import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorIntegracoesApiTable,
  fornecedorProdutoVinculosTable,
  productTable,
  produtoRascunhosTable,
} from "@/db/schema";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";
import { obterAmbienteAplicacaoLaquila } from "../lib/ambiente-laquila";
import type { TriagemProdutoRecebidoLaquila } from "../types/produto-laquila-mock.types";
import type { ProdutoApiStagingLaquilaCatalogo } from "./listar-produtos-api-staging-laquila";

type ProdutoRecebidoComTriagem = ProdutoApiStagingLaquilaCatalogo & {
  triagemSistema: TriagemProdutoRecebidoLaquila;
};

function normalizarTexto(valor: unknown) {
  return typeof valor === "string"
    ? valor.replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR")
    : "";
}

function lerTextoBruto(
  produto: ProdutoApiStagingLaquilaCatalogo,
  chaves: string[],
) {
  for (const chave of chaves) {
    const valor = produto.dadosBrutosJson[chave];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
    if (typeof valor === "number" && Number.isFinite(valor))
      return String(valor);
  }
  return "";
}

function extrairFotos(valor: unknown) {
  if (Array.isArray(valor)) {
    return valor
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof valor !== "string") return [];
  return valor
    .split(/[\n,;|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function numeroEquivalente(
  recebido: number | null,
  salvo: string | number | null,
  multiplicador = 1,
) {
  if (recebido === null) return true;
  if (salvo === null) return false;
  const numeroSalvo = Number(salvo);
  return (
    Number.isFinite(numeroSalvo) &&
    Math.round(recebido * multiplicador) ===
      Math.round(numeroSalvo * multiplicador)
  );
}

function campoNumericoBrutoEquivalente(
  produto: ProdutoApiStagingLaquilaCatalogo,
  campo: string,
  salvo: string | null,
) {
  const recebidoTexto = lerTextoBruto(produto, [campo]).replace(",", ".");
  if (!recebidoTexto) return true;
  const recebido = Number(recebidoTexto);
  if (!Number.isFinite(recebido)) return true;
  return numeroEquivalente(recebido, salvo, 10000);
}

function possuiMudancaRelevante(
  produto: ProdutoApiStagingLaquilaCatalogo,
  rascunho: {
    nome: string;
    descricao: string | null;
    ean: string | null;
    ncm: string | null;
    precoFornecedor: string | null;
    estoqueFornecedor: number | null;
    peso: string | null;
    altura: string | null;
    largura: string | null;
    comprimento: string | null;
    imagens: string[];
  } | null,
) {
  if (!rascunho) return true;

  const descricaoRecebida = lerTextoBruto(produto, ["descricao", "ds_item"]);
  const eanRecebido = lerTextoBruto(produto, ["cd_ean", "ean"]);
  const ncmRecebido = lerTextoBruto(produto, ["NCM", "ncm"]);
  const fotosRecebidas = extrairFotos(produto.dadosBrutosJson.lista_fotos);

  if (
    descricaoRecebida &&
    normalizarTexto(descricaoRecebida) !== normalizarTexto(rascunho.nome)
  ) {
    return true;
  }
  if (
    eanRecebido &&
    normalizarTexto(eanRecebido) !== normalizarTexto(rascunho.ean)
  ) {
    return true;
  }
  if (
    ncmRecebido &&
    normalizarTexto(ncmRecebido) !== normalizarTexto(rascunho.ncm)
  ) {
    return true;
  }
  if (!numeroEquivalente(produto.preco, rascunho.precoFornecedor, 100)) {
    return true;
  }
  if (!numeroEquivalente(produto.estoque, rascunho.estoqueFornecedor)) {
    return true;
  }
  if (!campoNumericoBrutoEquivalente(produto, "peso_bruto", rascunho.peso)) {
    return true;
  }
  if (
    !campoNumericoBrutoEquivalente(produto, "altura_caixa", rascunho.altura)
  ) {
    return true;
  }
  if (
    !campoNumericoBrutoEquivalente(produto, "largura_caixa", rascunho.largura)
  ) {
    return true;
  }
  if (
    !campoNumericoBrutoEquivalente(
      produto,
      "comprimento_caixa",
      rascunho.comprimento,
    )
  ) {
    return true;
  }
  if (
    fotosRecebidas.length > 0 &&
    normalizarTexto(fotosRecebidas[0]) !== normalizarTexto(rascunho.imagens[0])
  ) {
    return true;
  }

  return false;
}

export async function enriquecerTriagemProdutosLaquila(
  produtos: ProdutoApiStagingLaquilaCatalogo[],
): Promise<ProdutoRecebidoComTriagem[]> {
  const ambiente = obterAmbienteAplicacaoLaquila();
  if (produtos.length === 0) return [];

  const codigos = Array.from(
    new Set(produtos.map((produto) => produto.codigo.trim())),
  );

  try {
    const vinculos = await db
      .select({
        fornecedorId: fornecedorProdutoVinculosTable.fornecedorId,
        codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
        produtoId: fornecedorProdutoVinculosTable.produtoId,
        produtoAtivo: productTable.isActive,
        produtoStatus: productTable.status,
      })
      .from(fornecedorProdutoVinculosTable)
      .innerJoin(
        fornecedorIntegracoesApiTable,
        eq(
          fornecedorIntegracoesApiTable.fornecedorId,
          fornecedorProdutoVinculosTable.fornecedorId,
        ),
      )
      .innerJoin(
        productTable,
        eq(productTable.id, fornecedorProdutoVinculosTable.produtoId),
      )
      .where(
        and(
          eq(
            fornecedorIntegracoesApiTable.provedor,
            PROVEDOR_INTEGRACAO_LAQUILA,
          ),
          eq(fornecedorIntegracoesApiTable.ambiente, ambiente),
          eq(fornecedorProdutoVinculosTable.status, "ativo"),
          inArray(fornecedorProdutoVinculosTable.codigoFornecedor, codigos),
        ),
      );

    const fornecedoresIds = Array.from(
      new Set(vinculos.map((vinculo) => vinculo.fornecedorId)),
    );
    const rascunhos =
      fornecedoresIds.length > 0
        ? await db
            .select({
              fornecedorId: produtoRascunhosTable.fornecedorId,
              codigoFornecedor: produtoRascunhosTable.codigoFornecedor,
              nome: produtoRascunhosTable.nome,
              descricao: produtoRascunhosTable.descricao,
              ean: produtoRascunhosTable.ean,
              ncm: produtoRascunhosTable.ncm,
              precoFornecedor: produtoRascunhosTable.precoFornecedor,
              estoqueFornecedor: produtoRascunhosTable.estoqueFornecedor,
              peso: produtoRascunhosTable.peso,
              altura: produtoRascunhosTable.altura,
              largura: produtoRascunhosTable.largura,
              comprimento: produtoRascunhosTable.comprimento,
              imagens: produtoRascunhosTable.imagens,
            })
            .from(produtoRascunhosTable)
            .where(
              and(
                eq(
                  produtoRascunhosTable.origemProvedor,
                  PROVEDOR_INTEGRACAO_LAQUILA,
                ),
                inArray(produtoRascunhosTable.fornecedorId, fornecedoresIds),
                inArray(produtoRascunhosTable.codigoFornecedor, codigos),
              ),
            )
        : [];

    const vinculoPorCodigo = new Map(
      vinculos
        .filter((vinculo) => Boolean(vinculo.codigoFornecedor))
        .map((vinculo) => [vinculo.codigoFornecedor!, vinculo]),
    );
    const rascunhoPorChave = new Map(
      rascunhos
        .filter((rascunho) =>
          Boolean(rascunho.fornecedorId && rascunho.codigoFornecedor),
        )
        .map((rascunho) => [
          `${rascunho.fornecedorId}:${rascunho.codigoFornecedor}`,
          rascunho,
        ]),
    );

    return produtos.map((produto) => {
      const vinculo = vinculoPorCodigo.get(produto.codigo.trim());
      if (!vinculo) return { ...produto, triagemSistema: "novo" };

      const rascunho =
        rascunhoPorChave.get(
          `${vinculo.fornecedorId}:${vinculo.codigoFornecedor}`,
        ) ?? null;
      const publicadoAtivo =
        vinculo.produtoAtivo === true && vinculo.produtoStatus === "published";
      const possuiAtualizacao =
        !publicadoAtivo || possuiMudancaRelevante(produto, rascunho);

      return {
        ...produto,
        triagemSistema: possuiAtualizacao
          ? "atualizacao_disponivel"
          : "ja_publicado",
      };
    });
  } catch (erro) {
    const causa =
      erro instanceof Error && "cause" in erro
        ? (erro.cause as { message?: unknown; code?: unknown } | undefined)
        : undefined;
    console.error("[laquila:triagem:erro]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
      causa: typeof causa?.message === "string" ? causa.message : undefined,
      codigo: typeof causa?.code === "string" ? causa.code : undefined,
    });
    return produtos.map((produto) => ({ ...produto, triagemSistema: "novo" }));
  }
}
