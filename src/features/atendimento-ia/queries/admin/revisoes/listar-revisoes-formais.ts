import "server-only";

import { count, desc } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaRevisoesTable } from "@/db/schema";

import {
  criarPaginaAdmin,
  validarPaginacaoAdmin,
} from "../compartilhados/paginacao";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function listarRevisoesFormaisAdmin(entrada: unknown) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const filtros = validarPaginacaoAdmin(entrada);
  const [total, itens] = await Promise.all([
    db.select({ total: count() }).from(atendimentoIaRevisoesTable),
    db
      .select({
        atualizadoEm: atendimentoIaRevisoesTable.atualizadoEm,
        avaliacaoId: atendimentoIaRevisoesTable.avaliacaoId,
        criadoEm: atendimentoIaRevisoesTable.criadoEm,
        id: atendimentoIaRevisoesTable.id,
        propostaId: atendimentoIaRevisoesTable.propostaId,
        status: atendimentoIaRevisoesTable.status,
        versao: atendimentoIaRevisoesTable.versao,
      })
      .from(atendimentoIaRevisoesTable)
      .orderBy(
        desc(atendimentoIaRevisoesTable.atualizadoEm),
        desc(atendimentoIaRevisoesTable.id),
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
