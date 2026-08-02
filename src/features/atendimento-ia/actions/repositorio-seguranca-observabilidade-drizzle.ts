import "server-only";

import { and, eq, lt, sql } from "drizzle-orm";

import { atendimentoIaAuditoriasTable, atendimentoIaLimitesUsoTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import {
  classificarFalhaPersistenciaLimiteUso,
  type CodigoFalhaPersistenciaLimiteUso,
} from "../lib/classificar-falha-limite-uso";
import { hashReferenciaSegura, prepararEventoAuditoria } from "../lib/seguranca-observabilidade";
import type { RepositorioSegurancaObservabilidade } from "../types/seguranca-observabilidade";

export class ErroPersistenciaLimiteUso extends Error {
  readonly categoria = "persistencia_limite_uso";

  constructor(readonly codigo: CodigoFalhaPersistenciaLimiteUso, causa: unknown) {
    super(codigo, { cause: causa });
    this.name = "ErroPersistenciaLimiteUso";
  }
}

export class RepositorioSegurancaObservabilidadeDrizzle implements RepositorioSegurancaObservabilidade {
  async registrar(entrada: Parameters<RepositorioSegurancaObservabilidade["registrar"]>[0]) {
    const evento = prepararEventoAuditoria(entrada);
    if (evento.corrigeEventoId && !evento.justificativaCorrecao) throw new Error("JUSTIFICATIVA_CORRECAO_OBRIGATORIA");
    const [registro] = await dbTransacional.insert(atendimentoIaAuditoriasTable).values({
      acao: evento.acao,
      autorizacao: evento.autorizacao,
      categoria: evento.categoria,
      codigoFalha: evento.codigoFalha,
      conversaId: evento.conversaId,
      correlacaoId: evento.correlacaoId,
      corrigeEventoId: evento.corrigeEventoId,
      estadoAnterior: evento.estadoAnterior,
      estadoPosterior: evento.estadoPosterior,
      evento: evento.evento,
      execucaoFerramentaId: evento.execucaoFerramentaId,
      execucaoId: evento.execucaoId,
      hashIntegridade: evento.hashIntegridade,
      justificativaCorrecao: evento.justificativaCorrecao,
      mensagemId: evento.mensagemId,
      metadados: evento.metadados,
      referenciaSessaoHash: evento.referenciaSessaoHash,
      resultado: evento.resultado,
      severidade: evento.severidade,
      tipoAtor: evento.tipoAtor,
      usuarioId: evento.usuarioId,
      versoes: evento.versoes,
    }).returning({ hashIntegridade: atendimentoIaAuditoriasTable.hashIntegridade, id: atendimentoIaAuditoriasTable.id });
    if (!registro) throw new Error("AUDITORIA_INDISPONIVEL");
    return registro;
  }

  async consumirLimite(dados: Parameters<RepositorioSegurancaObservabilidade["consumirLimite"]>[0]) {
    const inicioMs = Math.floor(dados.agora.getTime() / dados.janelaEmMs) * dados.janelaEmMs;
    const janelaInicio = new Date(inicioMs);
    const janelaFim = new Date(inicioMs + dados.janelaEmMs);
    const referenciaHash = hashReferenciaSegura(dados.referencia);
    try {
      const [registro] = await dbTransacional.insert(atendimentoIaLimitesUsoTable).values({
        escopo: dados.escopo,
        janelaFim,
        janelaInicio,
        quantidade: 1,
        recurso: dados.recurso,
        referenciaHash,
      }).onConflictDoUpdate({
        set: { atualizadoEm: dados.agora, quantidade: sql`${atendimentoIaLimitesUsoTable.quantidade} + 1` },
        target: [atendimentoIaLimitesUsoTable.escopo, atendimentoIaLimitesUsoTable.referenciaHash, atendimentoIaLimitesUsoTable.recurso, atendimentoIaLimitesUsoTable.janelaInicio],
      }).returning({ quantidade: atendimentoIaLimitesUsoTable.quantidade });
      const quantidade = registro?.quantidade ?? dados.limite + 1;
      return { permitido: quantidade <= dados.limite, quantidade };
    } catch (erro) {
      throw new ErroPersistenciaLimiteUso(
        classificarFalhaPersistenciaLimiteUso(erro),
        erro,
      );
    }
  }

  async removerLimitesExpirados(agora: Date) {
    return dbTransacional.delete(atendimentoIaLimitesUsoTable)
      .where(lt(atendimentoIaLimitesUsoTable.janelaFim, agora))
      .returning({ id: atendimentoIaLimitesUsoTable.id });
  }

  async registrarCorrecao(dados: { eventoAnteriorId: string; justificativa: string; processo: string; correlacaoId: string }) {
    const [anterior] = await dbTransacional.select({ id: atendimentoIaAuditoriasTable.id })
      .from(atendimentoIaAuditoriasTable).where(eq(atendimentoIaAuditoriasTable.id, dados.eventoAnteriorId)).limit(1);
    if (!anterior) throw new Error("EVENTO_ANTERIOR_INDISPONIVEL");
    return this.registrar({
      categoria: "operacao", correlacaoId: dados.correlacaoId,
      corrigeEventoId: anterior.id, evento: "auditoria_corrigida",
      justificativaCorrecao: dados.justificativa, metadados: { processo: dados.processo },
      resultado: "sucesso_comprovado", severidade: "informativo", tipoAtor: "sistema",
    });
  }

  async excluirAuditoriaPorRetencao(dados: { antesDe: Date; categoria: "operacao" | "seguranca" | "privacidade" | "integracao" | "limite" }) {
    return dbTransacional.transaction(async (tx) => {
      const removidos = await tx.delete(atendimentoIaAuditoriasTable).where(and(
        eq(atendimentoIaAuditoriasTable.categoria, dados.categoria),
        lt(atendimentoIaAuditoriasTable.criadoEm, dados.antesDe),
      )).returning({ id: atendimentoIaAuditoriasTable.id });
      await tx.insert(atendimentoIaAuditoriasTable).values({
        categoria: "privacidade", correlacaoId: crypto.randomUUID(), evento: "retencao_executada",
        hashIntegridade: hashReferenciaSegura(`retencao:${dados.categoria}:${dados.antesDe.toISOString()}:${removidos.length}`),
        metadados: { categoria: dados.categoria, quantidade: removidos.length },
        resultado: "sucesso_comprovado", severidade: "informativo", tipoAtor: "sistema",
        versoes: { politica: "configuracao_ambiente" },
      });
      return removidos.length;
    });
  }
}
