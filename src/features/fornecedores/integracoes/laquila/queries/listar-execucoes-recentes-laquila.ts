import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorIntegracoesApiTable,
  importacoesFornecedorTable,
} from "@/db/schema";
import { contarItensImportacoesFornecedor } from "@/features/fornecedores/queries/contar-itens-importacoes-fornecedor";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";
import type { AmbienteLaquila } from "../lib/ambiente-laquila";

export type ExecucaoRecenteLaquilaAdmin = {
  id: string;
  criadoEm: string;
  status: string;
  total: number;
  pendentes: number;
  publicados: number;
  ignorados: number;
};

const LIMITE_EXECUCOES_RECENTES = 5;

/**
 * Últimas execuções da Laquila, com os contadores de cada uma.
 *
 * Usa a mesma contagem da lista geral de importações, então os números batem
 * entre as duas telas — e continuam separados por execução: o que a #101
 * publicou nunca soma no painel da #102.
 */
export async function listarExecucoesRecentesLaquila(
  ambiente: AmbienteLaquila,
): Promise<ExecucaoRecenteLaquilaAdmin[]> {
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

  if (!integracao) return [];

  const importacoes = await db
    .select({
      id: importacoesFornecedorTable.id,
      status: importacoesFornecedorTable.status,
      criadoEm: importacoesFornecedorTable.criadoEm,
    })
    .from(importacoesFornecedorTable)
    .where(
      and(
        eq(importacoesFornecedorTable.fornecedorId, integracao.fornecedorId),
        eq(importacoesFornecedorTable.tipoArquivo, "api"),
      ),
    )
    .orderBy(desc(importacoesFornecedorTable.criadoEm))
    .limit(LIMITE_EXECUCOES_RECENTES);

  const contadores = await contarItensImportacoesFornecedor(
    importacoes.map((importacao) => importacao.id),
  );

  return importacoes.map((importacao) => {
    const contador = contadores.get(importacao.id);

    return {
      id: importacao.id,
      status: importacao.status,
      criadoEm: importacao.criadoEm.toISOString(),
      total: contador?.total ?? 0,
      pendentes: contador?.pendentes ?? 0,
      publicados: contador?.publicados ?? 0,
      ignorados: contador?.ignorados ?? 0,
    };
  });
}
