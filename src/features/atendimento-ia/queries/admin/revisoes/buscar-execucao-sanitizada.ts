import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaExecucoesFerramentasTable,
  atendimentoIaExecucoesTable,
} from "@/db/schema";

import { sanitizarExecucaoAdmin } from "../../../lib/admin/sanitizacao/sanitizar-execucao-admin";
import { sanitizarFerramentaAdmin } from "../../../lib/admin/sanitizacao/sanitizar-ferramenta-admin";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function buscarExecucaoSanitizadaAdmin(id: string) {
  await exigirCapacidadeAtendimentoIa("conversas_sanitizadas_leitura");
  const [execucao] = await db
    .select({
      concluidoEm: atendimentoIaExecucoesTable.concluidoEm,
      duracaoEmMs: atendimentoIaExecucoesTable.duracaoEmMs,
      iniciadoEm: atendimentoIaExecucoesTable.iniciadoEm,
      modelo: atendimentoIaExecucoesTable.modelo,
      status: atendimentoIaExecucoesTable.status,
      tokensEntrada: atendimentoIaExecucoesTable.tokensEntrada,
      tokensSaida: atendimentoIaExecucoesTable.tokensSaida,
    })
    .from(atendimentoIaExecucoesTable)
    .where(eq(atendimentoIaExecucoesTable.id, id))
    .limit(1);
  if (!execucao) return null;
  const ferramentas = await db
    .select({
      classificacao: atendimentoIaExecucoesFerramentasTable.classificacao,
      duracaoEmMs: atendimentoIaExecucoesFerramentasTable.duracaoEmMs,
      nomeFerramenta: atendimentoIaExecucoesFerramentasTable.nomeFerramenta,
      status: atendimentoIaExecucoesFerramentasTable.status,
    })
    .from(atendimentoIaExecucoesFerramentasTable)
    .where(eq(atendimentoIaExecucoesFerramentasTable.execucaoId, id));
  return sanitizarExecucaoAdmin(
    execucao,
    ferramentas.map(sanitizarFerramentaAdmin),
  );
}
