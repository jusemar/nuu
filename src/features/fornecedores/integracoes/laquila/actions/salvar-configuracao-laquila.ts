"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { fornecedorIntegracoesApiTable, fornecedoresTable } from "@/db/schema";

import {
  FORNECEDOR_LAQUILA_NOME,
  PROVEDOR_INTEGRACAO_LAQUILA,
} from "../constants";
import { criptografarTokenLaquila } from "../lib/mascarar-segredos-laquila";
import {
  configuracaoLaquilaSchema,
  normalizarFormularioConfiguracaoLaquila,
} from "../schemas";
import type { ResultadoSalvarConfiguracaoLaquila } from "../types";

function normalizarEntradaConfiguracaoLaquila(dadosEntrada: unknown) {
  if (dadosEntrada instanceof FormData) {
    return normalizarFormularioConfiguracaoLaquila(dadosEntrada);
  }

  return dadosEntrada;
}

type ErroComCausa = Error & {
  code?: string;
  cause?: {
    name?: string;
    code?: string;
    message?: string;
    sourceError?: {
      name?: string;
      code?: string;
      message?: string;
      cause?: {
        name?: string;
        code?: string;
        message?: string;
      };
    };
  };
};

function obterDetalhesErro(erro: unknown) {
  if (!(erro instanceof Error)) {
    return {
      mensagem: "Erro desconhecido",
      codigo: undefined,
      causa: undefined,
      nomeCausa: undefined,
    };
  }

  const erroComCausa = erro as ErroComCausa;

  return {
    mensagem: erro.message,
    codigo:
      erroComCausa.code ??
      erroComCausa.cause?.code ??
      erroComCausa.cause?.sourceError?.code ??
      erroComCausa.cause?.sourceError?.cause?.code,
    causa:
      erroComCausa.cause?.message ??
      erroComCausa.cause?.sourceError?.message ??
      erroComCausa.cause?.sourceError?.cause?.message,
    nomeCausa:
      erroComCausa.cause?.name ??
      erroComCausa.cause?.sourceError?.name ??
      erroComCausa.cause?.sourceError?.cause?.name,
  };
}

function sanitizarMensagemErro(mensagem: string) {
  return mensagem
    .replace(/params:[\s\S]*/i, "params: [removido]")
    .replace(
      /(api-dropshipping\.laquila\.com\.br\/)([^/\s]+)(\/\d{5})/gi,
      "$1[token-rota]$3",
    )
    .replace(/v1:[A-Za-z0-9+/=:-]+/g, "[token-criptografado-removido]");
}

function erroTabelaAusente(erro: unknown) {
  const detalhes = obterDetalhesErro(erro);

  return (
    detalhes.codigo === "42P01" ||
    detalhes.mensagem.includes("relation") ||
    detalhes.causa?.includes("relation")
  );
}

function erroTransitorioBanco(erro: unknown) {
  const detalhes = obterDetalhesErro(erro);
  const texto = `${detalhes.mensagem} ${detalhes.causa ?? ""}`.toLowerCase();

  return (
    texto.includes("fetch failed") ||
    texto.includes("network") ||
    texto.includes("timeout") ||
    detalhes.codigo === "ETIMEDOUT" ||
    detalhes.codigo === "ECONNRESET" ||
    (detalhes.nomeCausa === "NeonDbError" && !detalhes.codigo)
  );
}

function obterMensagemErroSalvarConfiguracao(erro: unknown) {
  const detalhes = obterDetalhesErro(erro);

  if (detalhes.mensagem.includes("BETTER_AUTH_SECRET")) {
    return "Segredo de criptografia não configurado.";
  }

  if (erroTabelaAusente(erro)) {
    return "Tabela da integração Laquila não encontrada no banco.";
  }

  if (erroTransitorioBanco(erro)) {
    return "Falha temporária ao acessar o banco. Tente salvar novamente.";
  }

  if (detalhes.mensagem.includes("fornecedores")) {
    return "Fornecedor Laquila não pôde ser localizado ou criado.";
  }

  return "Não foi possível salvar a configuração Laquila.";
}

async function executarBancoLaquila<T>(operacao: () => Promise<T>): Promise<T> {
  try {
    return await operacao();
  } catch (erro) {
    if (!erroTransitorioBanco(erro)) {
      throw erro;
    }

    console.warn("[salvarConfiguracaoLaquila:banco:tentando-novamente]", {
      ...obterDetalhesErroSeguro(erro),
    });

    return operacao();
  }
}

function obterDetalhesErroSeguro(erro: unknown) {
  const detalhes = obterDetalhesErro(erro);

  return {
    ...detalhes,
    mensagem: sanitizarMensagemErro(detalhes.mensagem),
    causa: detalhes.causa ? sanitizarMensagemErro(detalhes.causa) : undefined,
  };
}

async function buscarOuCriarFornecedorLaquila(fornecedorId?: string) {
  if (fornecedorId) {
    return fornecedorId;
  }

  const [fornecedorExistente] = await executarBancoLaquila(() =>
    db
      .select({
        id: fornecedoresTable.id,
      })
      .from(fornecedoresTable)
      .where(
        and(
          eq(fornecedoresTable.nome, FORNECEDOR_LAQUILA_NOME),
          eq(fornecedoresTable.tipoIntegracao, "api"),
        ),
      )
      .limit(1),
  );

  if (fornecedorExistente) return fornecedorExistente.id;

  const agora = new Date();
  const [fornecedorCriado] = await executarBancoLaquila(() =>
    db
      .insert(fornecedoresTable)
      .values({
        nome: FORNECEDOR_LAQUILA_NOME,
        tipoIntegracao: "api",
        status: "ativo",
        criadoEm: agora,
        atualizadoEm: agora,
      })
      .returning({ id: fornecedoresTable.id }),
  );

  return fornecedorCriado.id;
}

export async function salvarConfiguracaoLaquila(
  dadosEntrada: unknown,
): Promise<ResultadoSalvarConfiguracaoLaquila> {
  try {
    const validacao = configuracaoLaquilaSchema.safeParse(
      normalizarEntradaConfiguracaoLaquila(dadosEntrada),
    );

    if (!validacao.success) {
      return {
        sucesso: false,
        erro:
          validacao.error.issues[0]?.message ??
          "Dados inválidos para configurar a integração Laquila.",
      };
    }

    const dados = validacao.data;
    const fornecedorId = await buscarOuCriarFornecedorLaquila(
      dados.fornecedorId,
    );
    const agora = new Date();
    const cnpjEmpresa = dados.cnpjEmpresa.replace(/\D/g, "");
    let integracaoId = dados.id;

    const [configuracaoAtual] = await executarBancoLaquila(() =>
      db
        .select({
          id: fornecedorIntegracoesApiTable.id,
          tokenClienteCriptografado:
            fornecedorIntegracoesApiTable.tokenClienteCriptografado,
        })
        .from(fornecedorIntegracoesApiTable)
        .where(
          and(
            eq(fornecedorIntegracoesApiTable.fornecedorId, fornecedorId),
            eq(
              fornecedorIntegracoesApiTable.provedor,
              PROVEDOR_INTEGRACAO_LAQUILA,
            ),
          ),
        )
        .limit(1),
    );

    const tokenClienteCriptografado = dados.tokenCliente
      ? criptografarTokenLaquila(dados.tokenCliente)
      : configuracaoAtual?.tokenClienteCriptografado;

    if (configuracaoAtual) {
      integracaoId = configuracaoAtual.id;

      await executarBancoLaquila(() =>
        db
          .update(fornecedorIntegracoesApiTable)
          .set({
            ambiente: dados.ambiente,
            urlBase: dados.urlBase ?? null,
            cnpjEmpresa,
            tokenClienteCriptografado,
            ativo: dados.ativo,
            atualizadoEm: agora,
          })
          .where(eq(fornecedorIntegracoesApiTable.id, configuracaoAtual.id)),
      );
    } else {
      const [configuracaoCriada] = await executarBancoLaquila(() =>
        db
          .insert(fornecedorIntegracoesApiTable)
          .values({
            fornecedorId,
            provedor: PROVEDOR_INTEGRACAO_LAQUILA,
            ambiente: dados.ambiente,
            urlBase: dados.urlBase ?? null,
            cnpjEmpresa,
            tokenClienteCriptografado,
            ativo: dados.ativo,
            criadoEm: agora,
            atualizadoEm: agora,
          })
          .returning({ id: fornecedorIntegracoesApiTable.id }),
      );

      integracaoId = configuracaoCriada.id;
    }

    revalidatePath("/admin/fornecedores");
    revalidatePath("/admin/fornecedores/integracoes/laquila");

    return {
      sucesso: true,
      mensagem: "Configuração Laquila salva com segurança.",
      integracaoId,
    };
  } catch (erro) {
    console.error("[salvarConfiguracaoLaquila]", {
      ...obterDetalhesErroSeguro(erro),
      tabelaAusente: erroTabelaAusente(erro),
      transitorioBanco: erroTransitorioBanco(erro),
    });

    return {
      sucesso: false,
      erro: obterMensagemErroSalvarConfiguracao(erro),
    };
  }
}

export const atualizarConfiguracaoLaquila = salvarConfiguracaoLaquila;
