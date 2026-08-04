import "server-only";

import { count, desc, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaConversasTable } from "@/db/schema";

import { identificadorAdministrativoSeguro } from "../../../lib/admin/sanitizacao/mascarar-dados-pessoais-admin";
import type { ConversaRevisaoDto } from "../../../types/admin/consultas";
import {
  criarPaginaAdmin,
  validarPaginacaoAdmin,
} from "../compartilhados/paginacao";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function listarConversasRevisaoAdmin(entrada: unknown) {
  await exigirCapacidadeAtendimentoIa("conversas_sanitizadas_leitura");
  const filtros = validarPaginacaoAdmin(entrada);
  const [total, linhas] = await Promise.all([
    db.select({ total: count() }).from(atendimentoIaConversasTable),
    db
      .select({
        avaliada: sql<boolean>`exists(select 1 from atendimento_ia_avaliacoes a where a.conversa_id = ${atendimentoIaConversasTable.id})`,
        criadoEm: atendimentoIaConversasTable.criadoEm,
        duracaoEmMs: sql<
          number | null
        >`(select max(e.duracao_em_ms) from atendimento_ia_execucoes e where e.conversa_id = ${atendimentoIaConversasTable.id})`,
        id: atendimentoIaConversasTable.id,
        modelo: sql<
          string | null
        >`(select e.modelo from atendimento_ia_execucoes e where e.conversa_id = ${atendimentoIaConversasTable.id} order by e.iniciado_em desc, e.id desc limit 1)`,
        ocorrencia: sql<boolean>`exists(select 1 from atendimento_ia_ocorrencias o where o.conversa_id = ${atendimentoIaConversasTable.id})`,
        quantidadeMensagens: sql<number>`(select count(*)::int from atendimento_ia_mensagens m where m.conversa_id = ${atendimentoIaConversasTable.id})`,
        status: atendimentoIaConversasTable.status,
        statusProcessamento: sql<
          string | null
        >`(select e.status::text from atendimento_ia_execucoes e where e.conversa_id = ${atendimentoIaConversasTable.id} order by e.iniciado_em desc, e.id desc limit 1)`,
        transferencia: sql<boolean>`exists(select 1 from atendimento_ia_transferencias t where t.conversa_id = ${atendimentoIaConversasTable.id})`,
      })
      .from(atendimentoIaConversasTable)
      .orderBy(
        desc(atendimentoIaConversasTable.criadoEm),
        desc(atendimentoIaConversasTable.id),
      )
      .limit(filtros.limite)
      .offset(filtros.deslocamento),
  ]);
  const itens: ConversaRevisaoDto[] = linhas.map((item) => ({
    ...item,
    criadoEm: item.criadoEm.toISOString(),
    identificador: identificadorAdministrativoSeguro(item.id),
    referencia: item.id,
  }));
  return criarPaginaAdmin(
    itens.map((item) => ({
      avaliada: item.avaliada,
      criadoEm: item.criadoEm,
      duracaoEmMs: item.duracaoEmMs,
      identificador: item.identificador,
      modelo: item.modelo,
      ocorrencia: item.ocorrencia,
      quantidadeMensagens: item.quantidadeMensagens,
      referencia: item.referencia,
      status: item.status,
      statusProcessamento: item.statusProcessamento,
      transferencia: item.transferencia,
    })),
    total[0]?.total ?? 0,
    filtros.pagina,
    filtros.limite,
  );
}
