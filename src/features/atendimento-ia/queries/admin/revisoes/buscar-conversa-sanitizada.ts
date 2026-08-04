import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaAuditoriasTable,
  atendimentoIaAvaliacoesTable,
  atendimentoIaConversasTable,
  atendimentoIaExecucoesTable,
  atendimentoIaMensagensTable,
  atendimentoIaOcorrenciasTable,
  atendimentoIaTransferenciasTable,
} from "@/db/schema";

import {
  identificadorAdministrativoSeguro,
  mascararDadosPessoaisAdmin,
} from "../../../lib/admin/sanitizacao/mascarar-dados-pessoais-admin";
import { sanitizarMensagemAdmin } from "../../../lib/admin/sanitizacao/sanitizar-conversa-admin";
import type { ConversaSanitizadaDto } from "../../../types/admin/consultas";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { buscarExecucaoSanitizadaAdmin } from "./buscar-execucao-sanitizada";

export async function buscarConversaSanitizadaAdmin(
  id: string,
): Promise<ConversaSanitizadaDto | null> {
  const acesso = await exigirCapacidadeAtendimentoIa(
    "conversas_sanitizadas_leitura",
  );
  if (!acesso) return null;
  const [conversa] = await db
    .select({
      criadoEm: atendimentoIaConversasTable.criadoEm,
      id: atendimentoIaConversasTable.id,
      status: atendimentoIaConversasTable.status,
    })
    .from(atendimentoIaConversasTable)
    .where(eq(atendimentoIaConversasTable.id, id))
    .limit(1);
  if (!conversa) return null;
  const [
    mensagens,
    execucoesIds,
    transferencias,
    ocorrencias,
    avaliacoes,
    fontesRag,
  ] = await Promise.all([
    db
      .select({
        autor: atendimentoIaMensagensTable.autor,
        conteudo: atendimentoIaMensagensTable.conteudo,
        criadoEm: atendimentoIaMensagensTable.criadoEm,
        id: atendimentoIaMensagensTable.id,
        status: atendimentoIaMensagensTable.status,
      })
      .from(atendimentoIaMensagensTable)
      .where(eq(atendimentoIaMensagensTable.conversaId, id))
      .orderBy(
        asc(atendimentoIaMensagensTable.criadoEm),
        asc(atendimentoIaMensagensTable.id),
      )
      .limit(200),
    db
      .select({ id: atendimentoIaExecucoesTable.id })
      .from(atendimentoIaExecucoesTable)
      .where(eq(atendimentoIaExecucoesTable.conversaId, id))
      .orderBy(
        asc(atendimentoIaExecucoesTable.iniciadoEm),
        asc(atendimentoIaExecucoesTable.id),
      )
      .limit(100),
    db
      .select({
        canal: atendimentoIaTransferenciasTable.canal,
        motivo: atendimentoIaTransferenciasTable.motivo,
        status: atendimentoIaTransferenciasTable.status,
      })
      .from(atendimentoIaTransferenciasTable)
      .where(eq(atendimentoIaTransferenciasTable.conversaId, id)),
    db
      .select({
        descricao: atendimentoIaOcorrenciasTable.descricaoSanitizada,
        tipo: atendimentoIaOcorrenciasTable.tipo,
      })
      .from(atendimentoIaOcorrenciasTable)
      .where(eq(atendimentoIaOcorrenciasTable.conversaId, id)),
    db
      .select({
        nota: atendimentoIaAvaliacoesTable.nota,
        origem: atendimentoIaAvaliacoesTable.origem,
      })
      .from(atendimentoIaAvaliacoesTable)
      .where(eq(atendimentoIaAvaliacoesTable.conversaId, id)),
    db.execute(
      sql`select b.status::text as status, b.conflito, count(r.id)::int as fontes from atendimento_ia_buscas_rag b left join atendimento_ia_resultados_rag r on r.busca_id = b.id join atendimento_ia_execucoes e on e.id = b.execucao_id where e.conversa_id = ${id} group by b.id, b.status, b.conflito order by b.criado_em asc limit 100`,
    ),
  ]);
  const execucoes = (
    await Promise.all(
      execucoesIds.map((item) => buscarExecucaoSanitizadaAdmin(item.id)),
    )
  ).filter((item) => item !== null);
  await db.insert(atendimentoIaAuditoriasTable).values({
    acao: "visualizar_conversa_sanitizada",
    autorizacao: "permitida",
    categoria: "privacidade",
    evento: "atendimento_ia_conversa_admin_visualizada",
    identificadorAtor: acesso.usuarioId,
    metadados: { conversaReferencia: identificadorAdministrativoSeguro(id) },
    resultado: "sucesso_comprovado",
    severidade: "informativo",
    tipoAtor: "usuario_admin",
    usuarioId: acesso.usuarioId,
    versoes: { sanitizacaoAdmin: "v1" },
  });
  return {
    avaliacoes,
    criadoEm: conversa.criadoEm.toISOString(),
    execucoes,
    fontesRag: fontesRag.rows.map((item) => ({
      conflito: Boolean(item.conflito),
      fontes: Number(item.fontes),
      status: String(item.status),
    })),
    identificador: identificadorAdministrativoSeguro(id),
    referencia: id,
    mensagens: mensagens.map(sanitizarMensagemAdmin),
    ocorrencias: ocorrencias.map((item) => ({
      descricao: mascararDadosPessoaisAdmin(item.descricao, 500),
      tipo: item.tipo,
    })),
    status: conversa.status,
    transferencias: transferencias.map((item) => ({
      ...item,
      motivo: mascararDadosPessoaisAdmin(item.motivo, 300),
    })),
  };
}
