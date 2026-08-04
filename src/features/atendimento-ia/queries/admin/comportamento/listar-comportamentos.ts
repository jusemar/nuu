import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaComportamentosTable,
  atendimentoIaComportamentoVersoesTable,
} from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function listarComportamentosAdmin() {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const itens = await db
    .select()
    .from(atendimentoIaComportamentosTable)
    .orderBy(desc(atendimentoIaComportamentosTable.atualizadoEm));
  return Promise.all(
    itens.map(async (item) => {
      const [v] = await db
        .select({
          atualizadoEm: atendimentoIaComportamentoVersoesTable.atualizadoEm,
          configuracao:
            atendimentoIaComportamentoVersoesTable.configuracaoEstruturada,
          estado: atendimentoIaComportamentoVersoesTable.estado,
          id: atendimentoIaComportamentoVersoesTable.id,
          numero: atendimentoIaComportamentoVersoesTable.numeroVersao,
          revisadoEm: atendimentoIaComportamentoVersoesTable.revisadoEm,
        })
        .from(atendimentoIaComportamentoVersoesTable)
        .where(
          eq(atendimentoIaComportamentoVersoesTable.comportamentoId, item.id),
        )
        .orderBy(desc(atendimentoIaComportamentoVersoesTable.numeroVersao))
        .limit(1);
      const historico = await db
        .select({
          atualizadoEm: atendimentoIaComportamentoVersoesTable.atualizadoEm,
          estado: atendimentoIaComportamentoVersoesTable.estado,
          hash: atendimentoIaComportamentoVersoesTable.hash,
          id: atendimentoIaComportamentoVersoesTable.id,
          numero: atendimentoIaComportamentoVersoesTable.numeroVersao,
          restauradaDeVersaoId:
            atendimentoIaComportamentoVersoesTable.restauradaDeVersaoId,
        })
        .from(atendimentoIaComportamentoVersoesTable)
        .where(
          eq(atendimentoIaComportamentoVersoesTable.comportamentoId, item.id),
        )
        .orderBy(desc(atendimentoIaComportamentoVersoesTable.numeroVersao));
      return {
        ...item,
        criadoEm: item.criadoEm.toISOString(),
        atualizadoEm: item.atualizadoEm.toISOString(),
        historico: historico.map((versao) => ({
          ...versao,
          atualizadoEm: versao.atualizadoEm.toISOString(),
        })),
        versao: v
          ? {
              ...v,
              atualizadoEm: v.atualizadoEm.toISOString(),
              revisadoEm: v.revisadoEm?.toISOString() ?? null,
            }
          : null,
      };
    }),
  );
}
