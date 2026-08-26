import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedoresTable,
  fornecedorIntegracoesApiTable,
  importacoesFornecedorTable,
} from "@/db/schema";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";
import { obterAmbienteAplicacaoLaquila } from "../lib/ambiente-laquila";

export type ImportacaoApiLaquila = {
  id: string;
  fornecedorId: string;
  nomeFornecedor: string;
  status: string;
  totalLinhas: number;
  criadoEm: Date;
  integracaoApiId: string | null;
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function extrairIntegracaoApiId(configuracaoFluxoJson: unknown) {
  if (!ehRegistro(configuracaoFluxoJson)) return null;
  const valor = configuracaoFluxoJson.integracaoApiId;
  return typeof valor === "string" && valor.trim() ? valor : null;
}

/**
 * Carrega UMA execução da API pelo id da rota.
 *
 * Devolve `null` quando o id não existe, não é de API ou não é da Laquila —
 * é essa checagem que impede uma importação de arquivo de ser aberta pelas
 * telas da integração e vice-versa.
 */
export async function buscarImportacaoApiLaquila(
  importacaoId: string,
): Promise<ImportacaoApiLaquila | null> {
  const [importacao] = await db
    .select({
      id: importacoesFornecedorTable.id,
      fornecedorId: importacoesFornecedorTable.fornecedorId,
      nomeFornecedor: fornecedoresTable.nome,
      status: importacoesFornecedorTable.status,
      totalLinhas: importacoesFornecedorTable.totalLinhas,
      criadoEm: importacoesFornecedorTable.criadoEm,
      configuracaoFluxoJson: importacoesFornecedorTable.configuracaoFluxoJson,
    })
    .from(importacoesFornecedorTable)
    .innerJoin(
      fornecedoresTable,
      eq(importacoesFornecedorTable.fornecedorId, fornecedoresTable.id),
    )
    .where(
      and(
        eq(importacoesFornecedorTable.id, importacaoId),
        eq(importacoesFornecedorTable.tipoArquivo, "api"),
      ),
    )
    .limit(1);

  if (!importacao) return null;

  const provedor = ehRegistro(importacao.configuracaoFluxoJson)
    ? importacao.configuracaoFluxoJson.provedor
    : null;

  if (provedor && provedor !== PROVEDOR_INTEGRACAO_LAQUILA) return null;

  return {
    id: importacao.id,
    fornecedorId: importacao.fornecedorId,
    nomeFornecedor: importacao.nomeFornecedor,
    status: importacao.status,
    totalLinhas: importacao.totalLinhas,
    criadoEm: importacao.criadoEm,
    integracaoApiId: extrairIntegracaoApiId(importacao.configuracaoFluxoJson),
  };
}

/**
 * Execução de API mais recente da Laquila.
 *
 * Serve aos redirecionamentos das rotas antigas (`/laquila/mapeamento` e
 * companhia), que não carregavam identidade nenhuma: em vez de quebrar o link,
 * o gestor cai na última execução real. Devolve `null` quando ainda não existe
 * nenhuma — aí o destino é a tela da integração, para iniciar uma.
 */
export async function buscarUltimaImportacaoApiLaquila(): Promise<
  string | null
> {
  const ambiente = obterAmbienteAplicacaoLaquila();
  const [integracao] = await db
    .select({ fornecedorId: fornecedorIntegracoesApiTable.fornecedorId })
    .from(fornecedorIntegracoesApiTable)
    .where(
      and(
        eq(fornecedorIntegracoesApiTable.provedor, PROVEDOR_INTEGRACAO_LAQUILA),
        eq(fornecedorIntegracoesApiTable.ambiente, ambiente),
      ),
    )
    .limit(1);

  if (!integracao) return null;

  const [importacao] = await db
    .select({ id: importacoesFornecedorTable.id })
    .from(importacoesFornecedorTable)
    .where(
      and(
        eq(importacoesFornecedorTable.fornecedorId, integracao.fornecedorId),
        eq(importacoesFornecedorTable.tipoArquivo, "api"),
      ),
    )
    .orderBy(desc(importacoesFornecedorTable.criadoEm))
    .limit(1);

  return importacao?.id ?? null;
}
