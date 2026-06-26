"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import {
  fornecedorIntegracoesApiTable,
  fornecedorProdutosApiStagingTable,
  fornecedoresTable,
} from "@/db/schema";
import { db } from "@/db/connection";
import { auth } from "@/lib/auth";

import {
  FORNECEDOR_LAQUILA_NOME,
  METODOS_LAQUILA,
  PROVEDOR_INTEGRACAO_LAQUILA,
} from "../constants";
import type { ItemProdutoLaquilaApi } from "../lib/cliente-laquila";
import { normalizarProdutosLaquila } from "../lib/normalizar-produto-laquila";
import { registrarLogIntegracaoFornecedorApi } from "../lib/registrar-log-integracao-fornecedor-api";
import { salvarProdutosSelecionadosStagingLaquilaSchema } from "../schemas";

type ResultadoSalvarProdutosSelecionadosStagingLaquila = {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  totalSelecionado?: number;
  totalSalvo?: number;
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function obterTexto(registro: Record<string, unknown>, chave: string) {
  const valor = registro[chave];

  if (typeof valor === "string") return valor.trim();
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);

  return "";
}

function montarItemApiLaquila(valor: unknown): ItemProdutoLaquilaApi | null {
  if (!ehRegistro(valor)) return null;

  const dadosBrutosOriginais = ehRegistro(valor.dadosBrutosJson)
    ? valor.dadosBrutosJson
    : ehRegistro(valor.dados_brutos_json)
      ? valor.dados_brutos_json
      : {};
  const dadosBrutos = { ...dadosBrutosOriginais };

  const item: Record<string, unknown> = {
    ...dadosBrutos,
    cd_item: obterTexto(valor, "cd_item") || obterTexto(dadosBrutos, "cd_item"),
    descricao:
      obterTexto(valor, "descricao") || obterTexto(dadosBrutos, "descricao"),
    cd_ean: obterTexto(valor, "cd_ean") || obterTexto(dadosBrutos, "cd_ean"),
    NCM: obterTexto(valor, "NCM") || obterTexto(dadosBrutos, "NCM"),
    ds_ggrupo:
      obterTexto(valor, "ds_ggrupo") || obterTexto(dadosBrutos, "ds_ggrupo"),
    ds_grupo:
      obterTexto(valor, "ds_grupo") || obterTexto(dadosBrutos, "ds_grupo"),
    ds_sgrupo:
      obterTexto(valor, "ds_sgrupo") || obterTexto(dadosBrutos, "ds_sgrupo"),
    lista_fotos:
      valor.lista_fotos ?? dadosBrutos.lista_fotos ?? dadosBrutos.imagemUrl,
    vl_preco: valor.vl_preco ?? dadosBrutos.vl_preco ?? null,
    qt_saldo: valor.qt_saldo ?? dadosBrutos.qt_saldo ?? null,
    peso_bruto:
      obterTexto(valor, "peso_bruto") || obterTexto(dadosBrutos, "peso_bruto"),
    altura_caixa:
      obterTexto(valor, "altura_caixa") ||
      obterTexto(dadosBrutos, "altura_caixa"),
    largura_caixa:
      obterTexto(valor, "largura_caixa") ||
      obterTexto(dadosBrutos, "largura_caixa"),
    comprimento_caixa:
      obterTexto(valor, "comprimento_caixa") ||
      obterTexto(dadosBrutos, "comprimento_caixa"),
  };

  if (!item.cd_item || !item.descricao) return null;

  return item;
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

async function validarSessaoAdmin() {
  const sessao = await auth.api.getSession({
    headers: await headers(),
  });

  return Boolean(sessao?.user);
}

async function buscarIntegracaoLaquilaAtual() {
  const [integracao] = await db
    .select({
      id: fornecedorIntegracoesApiTable.id,
    })
    .from(fornecedorIntegracoesApiTable)
    .innerJoin(
      fornecedoresTable,
      eq(fornecedorIntegracoesApiTable.fornecedorId, fornecedoresTable.id),
    )
    .where(
      and(
        eq(fornecedorIntegracoesApiTable.provedor, PROVEDOR_INTEGRACAO_LAQUILA),
        eq(fornecedoresTable.nome, FORNECEDOR_LAQUILA_NOME),
      ),
    )
    .limit(1);

  return integracao ?? null;
}

export async function salvarProdutosSelecionadosStagingLaquila(
  entrada: unknown,
): Promise<ResultadoSalvarProdutosSelecionadosStagingLaquila> {
  const validacao =
    salvarProdutosSelecionadosStagingLaquilaSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro:
        validacao.error.issues[0]?.message ??
        "Dados inválidos para salvar produtos selecionados.",
    };
  }

  const sessaoValida = await validarSessaoAdmin();

  if (!sessaoValida) {
    return {
      sucesso: false,
      erro: "Sessão expirada. Entre novamente para salvar os selecionados.",
    };
  }

  const integracao = await buscarIntegracaoLaquilaAtual();

  if (!integracao) {
    return {
      sucesso: false,
      erro: "Configuração Laquila não encontrada.",
    };
  }

  try {
    const itensApi = validacao.data.produtos.flatMap((produto) => {
      const item = montarItemApiLaquila(produto);

      return item ? [item] : [];
    });
    const itensUnicosPorCodigo = new Map<string, ItemProdutoLaquilaApi>();

    for (const item of itensApi) {
      itensUnicosPorCodigo.set(String(item.cd_item), item);
    }

    const produtosNormalizados = normalizarProdutosLaquila(
      Array.from(itensUnicosPorCodigo.values()),
    );

    if (produtosNormalizados.length === 0) {
      return {
        sucesso: false,
        erro: "Nenhum produto selecionado pôde ser preparado para vinculação.",
        totalSelecionado: validacao.data.produtos.length,
        totalSalvo: 0,
      };
    }

    const agora = new Date();

    await db.transaction(async (tx) => {
      await tx
        .delete(fornecedorProdutosApiStagingTable)
        .where(
          eq(
            fornecedorProdutosApiStagingTable.integracaoApiId,
            integracao.id,
          ),
        );

      await tx.insert(fornecedorProdutosApiStagingTable).values(
        produtosNormalizados.map((produto) => ({
          integracaoApiId: integracao.id,
          codigoFornecedor: produto.codigoFornecedor,
          nomeProduto: produto.nomeProduto,
          ean: produto.ean,
          ncm: produto.ncm,
          marcaFornecedor: produto.marcaFornecedor,
          grupoFornecedor: produto.grupoFornecedor,
          subgrupoFornecedor: produto.subgrupoFornecedor,
          precoFornecedor: produto.precoFornecedor,
          estoqueFornecedor: produto.estoqueFornecedor,
          imagemUrl:
            produto.imagemUrl ??
            extrairPrimeiraFoto(produto.dadosBrutosJson.lista_fotos),
          unidade: produto.unidade,
          pesoBruto: produto.pesoBruto,
          pesoLiquido: produto.pesoLiquido,
          largura: produto.largura,
          altura: produto.altura,
          comprimento: produto.comprimento,
          dadosBrutosJson: produto.dadosBrutosJson,
          status: "novo" as const,
          ultimaConsultaEm: agora,
          atualizadoEm: agora,
        })),
      );
    });

    await registrarLogIntegracaoFornecedorApi({
      integracaoApiId: integracao.id,
      metodo: METODOS_LAQUILA.consultarItem,
      operacao: "salvar_selecionados_staging_laquila",
      status: "sucesso",
      mensagem: "Produtos selecionados salvos no staging Laquila.",
      responseResumo: {
        totalSelecionado: validacao.data.produtos.length,
        totalNormalizado: produtosNormalizados.length,
        totalSalvo: produtosNormalizados.length,
      },
    });

    revalidatePath("/admin/fornecedores/integracoes/laquila/vinculos");

    return {
      sucesso: true,
      mensagem: "Produtos selecionados salvos para vinculação.",
      totalSelecionado: validacao.data.produtos.length,
      totalSalvo: produtosNormalizados.length,
    };
  } catch (erro) {
    await registrarLogIntegracaoFornecedorApi({
      integracaoApiId: integracao.id,
      metodo: METODOS_LAQUILA.consultarItem,
      operacao: "salvar_selecionados_staging_laquila",
      status: "erro",
      mensagem:
        erro instanceof Error
          ? erro.message
          : "Erro desconhecido ao salvar selecionados.",
    }).catch(() => undefined);

    return {
      sucesso: false,
      erro: "Não foi possível salvar os produtos selecionados para vinculação.",
    };
  }
}
