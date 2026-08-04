import "server-only";

import { count, desc } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaPropostasMelhoriaTable } from "@/db/schema";

import {
  criarPaginaAdmin,
  validarPaginacaoAdmin,
} from "../compartilhados/paginacao";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function listarPropostasAdmin(entrada: unknown) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const filtros = validarPaginacaoAdmin(entrada);
  const [total, itens] = await Promise.all([
    db.select({ total: count() }).from(atendimentoIaPropostasMelhoriaTable),
    db
      .select({
        atualizadoEm: atendimentoIaPropostasMelhoriaTable.atualizadoEm,
        categoria: atendimentoIaPropostasMelhoriaTable.categoria,
        criadoEm: atendimentoIaPropostasMelhoriaTable.criadoEm,
        id: atendimentoIaPropostasMelhoriaTable.id,
        impacto: atendimentoIaPropostasMelhoriaTable.impacto,
        prioridade: atendimentoIaPropostasMelhoriaTable.prioridade,
        risco: atendimentoIaPropostasMelhoriaTable.risco,
        status: atendimentoIaPropostasMelhoriaTable.status,
        titulo: atendimentoIaPropostasMelhoriaTable.titulo,
      })
      .from(atendimentoIaPropostasMelhoriaTable)
      .orderBy(
        desc(atendimentoIaPropostasMelhoriaTable.atualizadoEm),
        desc(atendimentoIaPropostasMelhoriaTable.id),
      )
      .limit(filtros.limite)
      .offset(filtros.deslocamento),
  ]);
  return criarPaginaAdmin(
    itens.map((item) => ({
      ...item,
      atualizadoEm: item.atualizadoEm.toISOString(),
      criadoEm: item.criadoEm.toISOString(),
    })),
    total[0]?.total ?? 0,
    filtros.pagina,
    filtros.limite,
  );
}
