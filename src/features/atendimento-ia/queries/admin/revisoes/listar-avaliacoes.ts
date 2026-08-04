import "server-only";

import { count, desc } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaAvaliacoesTable } from "@/db/schema";

import {
  criarPaginaAdmin,
  validarPaginacaoAdmin,
} from "../compartilhados/paginacao";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function listarAvaliacoesAdmin(entrada: unknown) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const filtros = validarPaginacaoAdmin(entrada);
  const [total, itens] = await Promise.all([
    db.select({ total: count() }).from(atendimentoIaAvaliacoesTable),
    db
      .select({
        avaliadoEm: atendimentoIaAvaliacoesTable.avaliadoEm,
        classificacaoProblema:
          atendimentoIaAvaliacoesTable.classificacaoProblema,
        comentario: atendimentoIaAvaliacoesTable.comentario,
        criadoEm: atendimentoIaAvaliacoesTable.criadoEm,
        id: atendimentoIaAvaliacoesTable.id,
        nota: atendimentoIaAvaliacoesTable.nota,
        resultado: atendimentoIaAvaliacoesTable.resultado,
        rubricaVersao: atendimentoIaAvaliacoesTable.rubricaVersao,
        status: atendimentoIaAvaliacoesTable.status,
      })
      .from(atendimentoIaAvaliacoesTable)
      .orderBy(
        desc(atendimentoIaAvaliacoesTable.criadoEm),
        desc(atendimentoIaAvaliacoesTable.id),
      )
      .limit(filtros.limite)
      .offset(filtros.deslocamento),
  ]);
  return criarPaginaAdmin(
    itens.map((item) => ({
      ...item,
      avaliadoEm: item.avaliadoEm?.toISOString() ?? null,
      criadoEm: item.criadoEm.toISOString(),
    })),
    total[0]?.total ?? 0,
    filtros.pagina,
    filtros.limite,
  );
}
