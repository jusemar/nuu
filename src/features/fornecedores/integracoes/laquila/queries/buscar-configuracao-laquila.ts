import "server-only";

import { and, eq } from "drizzle-orm";

import { fornecedorIntegracoesApiTable, fornecedoresTable } from "@/db/schema";
import { db } from "@/db/connection";

import {
  FORNECEDOR_LAQUILA_NOME,
  PROVEDOR_INTEGRACAO_LAQUILA,
} from "../constants";
import { descriptografarTokenLaquila } from "../lib/mascarar-segredos-laquila";
import type { ConfiguracaoLaquilaAdmin } from "../types";

export async function buscarConfiguracaoLaquilaAdmin(): Promise<ConfiguracaoLaquilaAdmin | null> {
  const [registro] = await db
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

  if (!registro) return null;

  return {
    id: registro.id,
    fornecedorId: registro.fornecedorId,
    provedor: registro.provedor,
    ambiente: registro.ambiente,
    urlBase: registro.urlBase,
    cnpjEmpresa: registro.cnpjEmpresa,
    ativo: registro.ativo,
    ultimoTesteStatus: registro.ultimoTesteStatus,
    ultimoTesteEm: registro.ultimoTesteEm,
    criadoEm: registro.criadoEm,
    atualizadoEm: registro.atualizadoEm,
    nomeFornecedor: registro.nomeFornecedor,
    tokenConfigurado: Boolean(registro.tokenClienteCriptografado),
    tokenCliente: registro.tokenClienteCriptografado
      ? descriptografarTokenLaquila(registro.tokenClienteCriptografado)
      : null,
  };
}
