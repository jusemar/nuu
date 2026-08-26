import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedoresTable, fornecedorIntegracoesApiTable } from "@/db/schema";

import {
  FORNECEDOR_LAQUILA_NOME,
  PROVEDOR_INTEGRACAO_LAQUILA,
} from "../constants";
import {
  type AmbienteLaquila,
  resolverUrlBaseLaquila,
  validarAmbienteLaquilaAplicacao,
} from "../lib/ambiente-laquila";
import { descriptografarTokenLaquila } from "../lib/mascarar-segredos-laquila";
import type { ConfiguracaoLaquilaAdmin } from "../types";

const MAX_TENTATIVAS_CONFIGURACAO_LAQUILA = 3;
const ATRASO_RETRY_CONFIGURACAO_LAQUILA_MS = 600;

type ErroBancoLaquila = Error & {
  code?: string;
  detail?: string;
  table?: string;
  column?: string;
  constraint?: string;
  cause?: {
    code?: string;
    detail?: string;
    table?: string;
    column?: string;
    constraint?: string;
    message?: string;
    sourceError?: {
      code?: string;
      detail?: string;
      table?: string;
      column?: string;
      constraint?: string;
      message?: string;
      cause?: {
        code?: string;
        detail?: string;
        table?: string;
        column?: string;
        constraint?: string;
        message?: string;
      };
    };
  };
};

declare global {
  var __configuracaoLaquilaAdminCache:
    | Partial<
        Record<
          AmbienteLaquila,
          {
            valor: ConfiguracaoLaquilaAdmin | null;
            atualizadoEm: number;
          }
        >
      >
    | undefined;
}

function obterStoreConfiguracaoLaquila(ambiente: AmbienteLaquila) {
  globalThis.__configuracaoLaquilaAdminCache ??= {};
  globalThis.__configuracaoLaquilaAdminCache[ambiente] ??= {
    valor: null,
    atualizadoEm: 0,
  };

  return globalThis.__configuracaoLaquilaAdminCache[ambiente];
}

function clonarConfiguracaoLaquila(
  configuracao: ConfiguracaoLaquilaAdmin,
): ConfiguracaoLaquilaAdmin {
  return {
    ...configuracao,
    criadoEm: new Date(configuracao.criadoEm),
    atualizadoEm: new Date(configuracao.atualizadoEm),
    ultimoTesteEm: configuracao.ultimoTesteEm
      ? new Date(configuracao.ultimoTesteEm)
      : null,
  };
}

function salvarConfiguracaoLaquilaEmMemoria(
  configuracao: ConfiguracaoLaquilaAdmin,
) {
  const store = obterStoreConfiguracaoLaquila(configuracao.ambiente);

  store.valor = clonarConfiguracaoLaquila(configuracao);
  store.atualizadoEm = Date.now();
}

function obterConfiguracaoLaquilaEmMemoria(ambiente: AmbienteLaquila) {
  const configuracao = obterStoreConfiguracaoLaquila(ambiente).valor;

  return configuracao ? clonarConfiguracaoLaquila(configuracao) : null;
}

function removerDadosSensiveisErro(valor: string | undefined) {
  if (!valor) return undefined;

  return valor
    .replace(/params:[\s\S]*/i, "params: [removido]")
    .replace(/token_cliente_criptografado\s*=\s*'[^']+'/gi, "token: [removido]")
    .replace(/cnpj_empresa\s*=\s*'[^']+'/gi, "cnpj: [removido]")
    .replace(/\b\d{14}\b/g, "[cnpj-removido]")
    .replace(/v1:[A-Za-z0-9+/=:-]+/g, "[token-criptografado-removido]");
}

function aguardarConfiguracaoLaquila(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function obterDetalhesErroConfiguracaoLaquila(erro: unknown) {
  if (!(erro instanceof Error)) {
    return {
      message: "Erro desconhecido",
      causeMessage: undefined,
      causeCode: undefined,
      causeDetail: undefined,
      table: undefined,
      column: undefined,
      constraint: undefined,
    };
  }

  const erroBanco = erro as ErroBancoLaquila;
  const sourceError = erroBanco.cause?.sourceError;
  const sourceCause = sourceError?.cause;

  return {
    message: removerDadosSensiveisErro(erro.message),
    causeMessage: removerDadosSensiveisErro(
      erroBanco.cause?.message ?? sourceError?.message ?? sourceCause?.message,
    ),
    causeCode: erroBanco.code ?? erroBanco.cause?.code ?? sourceError?.code,
    causeDetail: removerDadosSensiveisErro(
      erroBanco.detail ?? erroBanco.cause?.detail ?? sourceError?.detail,
    ),
    table: erroBanco.table ?? erroBanco.cause?.table ?? sourceError?.table,
    column: erroBanco.column ?? erroBanco.cause?.column ?? sourceError?.column,
    constraint:
      erroBanco.constraint ??
      erroBanco.cause?.constraint ??
      sourceError?.constraint,
  };
}

function erroTransitorioBancoLaquila(erro: unknown) {
  const detalhes = obterDetalhesErroConfiguracaoLaquila(erro);
  const texto = `${detalhes.message ?? ""} ${
    detalhes.causeMessage ?? ""
  }`.toLowerCase();

  return (
    detalhes.causeCode === "ETIMEDOUT" ||
    detalhes.causeCode === "ECONNRESET" ||
    texto.includes("timeout") ||
    texto.includes("fetch failed") ||
    texto.includes("network")
  );
}

async function executarConsultaConfiguracaoLaquila<T>(
  operacao: () => Promise<T>,
) {
  let ultimoErro: unknown;

  for (
    let tentativa = 1;
    tentativa <= MAX_TENTATIVAS_CONFIGURACAO_LAQUILA;
    tentativa += 1
  ) {
    try {
      return await operacao();
    } catch (erro) {
      ultimoErro = erro;

      if (!erroTransitorioBancoLaquila(erro)) {
        throw erro;
      }

      console.warn("[laquila:configuracao:retry]", {
        tentativa,
        totalTentativas: MAX_TENTATIVAS_CONFIGURACAO_LAQUILA,
        ...obterDetalhesErroConfiguracaoLaquila(erro),
      });

      if (tentativa < MAX_TENTATIVAS_CONFIGURACAO_LAQUILA) {
        await aguardarConfiguracaoLaquila(
          ATRASO_RETRY_CONFIGURACAO_LAQUILA_MS * tentativa,
        );
      }
    }
  }

  throw ultimoErro;
}

function montarConfiguracaoLaquilaAdmin(registro: {
  id: string;
  fornecedorId: string;
  provedor: "laquila";
  ambiente: "homologacao" | "producao";
  urlBase: string | null;
  cnpjEmpresa: string;
  ativo: boolean;
  ultimoTesteStatus: "sucesso" | "erro" | "nao_testado";
  ultimoTesteEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
  tokenClienteCriptografado: string | null;
  nomeFornecedor: string | null;
}): ConfiguracaoLaquilaAdmin {
  return {
    id: registro.id,
    fornecedorId: registro.fornecedorId,
    provedor: registro.provedor,
    ambiente: registro.ambiente,
    urlBase: resolverUrlBaseLaquila(registro.ambiente, registro.urlBase),
    cnpjEmpresa: registro.cnpjEmpresa,
    ativo: registro.ativo,
    ultimoTesteStatus: registro.ultimoTesteStatus,
    ultimoTesteEm: registro.ultimoTesteEm,
    criadoEm: registro.criadoEm,
    atualizadoEm: registro.atualizadoEm,
    nomeFornecedor: registro.nomeFornecedor ?? FORNECEDOR_LAQUILA_NOME,
    tokenConfigurado: Boolean(registro.tokenClienteCriptografado),
    tokenCliente: registro.tokenClienteCriptografado
      ? descriptografarTokenLaquila(registro.tokenClienteCriptografado)
      : null,
  };
}

function obterConfiguracaoLaquilaFallback(
  erro: unknown,
  ambiente: AmbienteLaquila,
) {
  const configuracao = obterConfiguracaoLaquilaEmMemoria(ambiente);

  if (!configuracao) return null;

  console.warn("[laquila:configuracao:fallback-memoria]", {
    ...obterDetalhesErroConfiguracaoLaquila(erro),
  });

  return configuracao;
}

export async function buscarConfiguracaoLaquilaAdmin({
  ambiente,
}: {
  ambiente: AmbienteLaquila;
}): Promise<ConfiguracaoLaquilaAdmin | null> {
  validarAmbienteLaquilaAplicacao(ambiente);
  try {
    const [registro] = await executarConsultaConfiguracaoLaquila(() =>
      db
        .select({
          id: fornecedorIntegracoesApiTable.id,
          fornecedorId: fornecedorIntegracoesApiTable.fornecedorId,
          provedor: fornecedorIntegracoesApiTable.provedor,
          ambiente: fornecedorIntegracoesApiTable.ambiente,
          urlBase: fornecedorIntegracoesApiTable.urlBase,
          cnpjEmpresa: fornecedorIntegracoesApiTable.cnpjEmpresa,
          ativo: fornecedorIntegracoesApiTable.ativo,
          ultimoTesteStatus: fornecedorIntegracoesApiTable.ultimoTesteStatus,
          ultimoTesteEm: fornecedorIntegracoesApiTable.ultimoTesteEm,
          criadoEm: fornecedorIntegracoesApiTable.criadoEm,
          atualizadoEm: fornecedorIntegracoesApiTable.atualizadoEm,
          tokenClienteCriptografado:
            fornecedorIntegracoesApiTable.tokenClienteCriptografado,
          nomeFornecedor: fornecedoresTable.nome,
        })
        .from(fornecedorIntegracoesApiTable)
        .leftJoin(
          fornecedoresTable,
          eq(fornecedorIntegracoesApiTable.fornecedorId, fornecedoresTable.id),
        )
        .where(
          and(
            eq(
              fornecedorIntegracoesApiTable.provedor,
              PROVEDOR_INTEGRACAO_LAQUILA,
            ),
            eq(fornecedorIntegracoesApiTable.ambiente, ambiente),
          ),
        )
        .orderBy(
          desc(fornecedorIntegracoesApiTable.ativo),
          desc(fornecedorIntegracoesApiTable.atualizadoEm),
        )
        .limit(1),
    );

    if (!registro) return null;

    const configuracao = montarConfiguracaoLaquilaAdmin(registro);

    salvarConfiguracaoLaquilaEmMemoria(configuracao);

    return configuracao;
  } catch (erro) {
    const configuracaoFallback = erroTransitorioBancoLaquila(erro)
      ? obterConfiguracaoLaquilaFallback(erro, ambiente)
      : null;

    if (configuracaoFallback) return configuracaoFallback;

    console.error("[laquila:configuracao:erro]", {
      ...obterDetalhesErroConfiguracaoLaquila(erro),
    });

    return null;
  }
}
