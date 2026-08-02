import "server-only";

import { and, eq, inArray, isNull, lt, ne } from "drizzle-orm";

import {
  atendimentoIaConfirmacoesFerramentasTable,
  atendimentoIaOperacoesProtegidasTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { criarCorrelacaoSegura } from "../lib/seguranca-observabilidade";
import type { RepositorioConfirmacoesFerramentas } from "../types/confirmacoes-ferramentas";
import type { ResultadoFerramentaProtegida } from "../types/ferramentas-protegidas";
import { RepositorioSegurancaObservabilidadeDrizzle } from "./repositorio-seguranca-observabilidade-drizzle";

const camposConfirmacao = {
  acao: atendimentoIaConfirmacoesFerramentasTable.acao,
  conversaId: atendimentoIaConfirmacoesFerramentasTable.conversaId,
  execucaoId: atendimentoIaConfirmacoesFerramentasTable.execucaoSolicitacaoId,
  expiraEm: atendimentoIaConfirmacoesFerramentasTable.expiraEm,
  ferramenta: atendimentoIaConfirmacoesFerramentasTable.ferramenta,
  hashParametros: atendimentoIaConfirmacoesFerramentasTable.hashParametros,
  id: atendimentoIaConfirmacoesFerramentasTable.id,
  parametrosEssenciais: atendimentoIaConfirmacoesFerramentasTable.parametrosEssenciais,
  recursoId: atendimentoIaConfirmacoesFerramentasTable.recursoId,
  recursoTipo: atendimentoIaConfirmacoesFerramentasTable.recursoTipo,
  referenciaSessaoHash: atendimentoIaConfirmacoesFerramentasTable.referenciaSessaoHash,
  status: atendimentoIaConfirmacoesFerramentasTable.status,
  usuarioId: atendimentoIaConfirmacoesFerramentasTable.usuarioId,
};

function usuarioIgual(usuarioId: string | null) {
  return usuarioId === null
    ? isNull(atendimentoIaConfirmacoesFerramentasTable.usuarioId)
    : eq(atendimentoIaConfirmacoesFerramentasTable.usuarioId, usuarioId);
}

/** Persistência transacional das confirmações. Nunca recebe cookies ou tokens. */
export class RepositorioConfirmacoesFerramentasDrizzle
  implements RepositorioConfirmacoesFerramentas
{
  async buscar(id: string) {
    const [confirmacao] = await dbTransacional.select(camposConfirmacao)
      .from(atendimentoIaConfirmacoesFerramentasTable)
      .where(eq(atendimentoIaConfirmacoesFerramentasTable.id, id)).limit(1);
    return confirmacao ?? null;
  }
  async criar(dados: Parameters<RepositorioConfirmacoesFerramentas["criar"]>[0]) {
    const [criada] = await dbTransacional.insert(atendimentoIaConfirmacoesFerramentasTable).values({
      acao: dados.acao,
      conversaId: dados.conversaId,
      execucaoSolicitacaoId: dados.execucaoId,
      expiraEm: dados.expiraEm,
      ferramenta: dados.ferramenta,
      hashParametros: dados.hashParametros,
      parametrosEssenciais: dados.parametrosEssenciais,
      recursoId: dados.recursoId,
      recursoTipo: dados.recursoTipo,
      referenciaSessaoHash: dados.referenciaSessaoHash,
      usuarioId: dados.usuarioId,
    }).onConflictDoNothing().returning(camposConfirmacao);
    if (criada) return criada;
    const [existente] = await dbTransacional.select(camposConfirmacao)
      .from(atendimentoIaConfirmacoesFerramentasTable)
      .where(and(
        usuarioIgual(dados.usuarioId),
        eq(atendimentoIaConfirmacoesFerramentasTable.conversaId, dados.conversaId),
        eq(atendimentoIaConfirmacoesFerramentasTable.ferramenta, dados.ferramenta),
        eq(atendimentoIaConfirmacoesFerramentasTable.hashParametros, dados.hashParametros),
        inArray(atendimentoIaConfirmacoesFerramentasTable.status, ["pendente", "confirmada"]),
      )).limit(1);
    if (!existente) throw new Error("CONFIRMACAO_NAO_CRIADA");
    return existente;
  }

  async invalidarDivergentes(dados: Parameters<RepositorioConfirmacoesFerramentas["invalidarDivergentes"]>[0]) {
    const atualizadas = await dbTransacional.update(atendimentoIaConfirmacoesFerramentasTable)
      .set({ atualizadoEm: new Date(), status: "invalidada" })
      .where(and(
        eq(atendimentoIaConfirmacoesFerramentasTable.conversaId, dados.conversaId),
        usuarioIgual(dados.usuarioId),
        inArray(atendimentoIaConfirmacoesFerramentasTable.status, ["pendente", "confirmada"]),
        ne(atendimentoIaConfirmacoesFerramentasTable.hashParametros, dados.hashParametros),
      )).returning({ id: atendimentoIaConfirmacoesFerramentasTable.id });
    return atualizadas.length;
  }

  async expirar(agora: Date) {
    const atualizadas = await dbTransacional.update(atendimentoIaConfirmacoesFerramentasTable)
      .set({ atualizadoEm: agora, status: "expirada" })
      .where(and(
        inArray(atendimentoIaConfirmacoesFerramentasTable.status, ["pendente", "confirmada"]),
        lt(atendimentoIaConfirmacoesFerramentasTable.expiraEm, agora),
      )).returning({ id: atendimentoIaConfirmacoesFerramentasTable.id });
    return atualizadas.length;
  }

  async confirmarUnica(dados: Parameters<RepositorioConfirmacoesFerramentas["confirmarUnica"]>[0]) {
    return dbTransacional.transaction(async (tx) => {
      const pendentes = await tx.select(camposConfirmacao)
        .from(atendimentoIaConfirmacoesFerramentasTable)
        .where(and(
          eq(atendimentoIaConfirmacoesFerramentasTable.conversaId, dados.conversaId),
          usuarioIgual(dados.usuarioId),
          eq(atendimentoIaConfirmacoesFerramentasTable.referenciaSessaoHash, dados.referenciaSessaoHash),
          eq(atendimentoIaConfirmacoesFerramentasTable.status, "pendente"),
        )).for("update");
      const validas = pendentes.filter((item) => item.expiraEm > dados.agora);
      if (validas.length !== 1) return null;
      const [confirmada] = await tx.update(atendimentoIaConfirmacoesFerramentasTable)
        .set({ atualizadoEm: dados.agora, confirmadaEm: dados.agora, status: "confirmada" })
        .where(and(
          eq(atendimentoIaConfirmacoesFerramentasTable.id, validas[0].id),
          eq(atendimentoIaConfirmacoesFerramentasTable.status, "pendente"),
        )).returning(camposConfirmacao);
      return confirmada ?? null;
    });
  }

  async cancelarPendentes(dados: Parameters<RepositorioConfirmacoesFerramentas["cancelarPendentes"]>[0]) {
    const agora = new Date();
    const canceladas = await dbTransacional.update(atendimentoIaConfirmacoesFerramentasTable)
      .set({ atualizadoEm: agora, canceladaEm: agora, status: "cancelada" })
      .where(and(
        eq(atendimentoIaConfirmacoesFerramentasTable.conversaId, dados.conversaId),
        usuarioIgual(dados.usuarioId),
        inArray(atendimentoIaConfirmacoesFerramentasTable.status, ["pendente", "confirmada"]),
      )).returning({ id: atendimentoIaConfirmacoesFerramentasTable.id });
    return canceladas.length;
  }

  async consumir(dados: Parameters<RepositorioConfirmacoesFerramentas["consumir"]>[0]) {
    const [consumida] = await dbTransacional.update(atendimentoIaConfirmacoesFerramentasTable)
      .set({ atualizadoEm: dados.agora, consumidaEm: dados.agora, status: "consumida" })
      .where(and(
        eq(atendimentoIaConfirmacoesFerramentasTable.id, dados.confirmacaoId),
        eq(atendimentoIaConfirmacoesFerramentasTable.hashParametros, dados.hashParametros),
        eq(atendimentoIaConfirmacoesFerramentasTable.status, "confirmada"),
      )).returning({ id: atendimentoIaConfirmacoesFerramentasTable.id });
    return Boolean(consumida);
  }

  async reivindicarOperacao(dados: Parameters<RepositorioConfirmacoesFerramentas["reivindicarOperacao"]>[0]) {
    const [criada] = await dbTransacional.insert(atendimentoIaOperacoesProtegidasTable).values({
      acao: dados.confirmacao.acao,
      chaveIdempotencia: dados.chaveIdempotencia,
      confirmacaoId: dados.confirmacao.id,
      execucaoId: dados.execucaoId,
      ferramenta: dados.confirmacao.ferramenta,
      hashParametros: dados.confirmacao.hashParametros,
      recursoId: dados.confirmacao.recursoId,
      recursoTipo: dados.confirmacao.recursoTipo,
    }).onConflictDoNothing().returning({ id: atendimentoIaOperacoesProtegidasTable.id });
    if (criada) return { operacaoId: criada.id, tipo: "adquirida" as const };
    const [existente] = await dbTransacional.select({
      resultado: atendimentoIaOperacoesProtegidasTable.resultado,
      status: atendimentoIaOperacoesProtegidasTable.status,
    }).from(atendimentoIaOperacoesProtegidasTable)
      .where(eq(atendimentoIaOperacoesProtegidasTable.chaveIdempotencia, dados.chaveIdempotencia)).limit(1);
    if (existente?.status === "concluida" && existente.resultado) {
      return { resultado: existente.resultado as ResultadoFerramentaProtegida, tipo: "concluida" as const };
    }
    if (existente?.status === "resultado_incerto") return { tipo: "resultado_incerto" as const };
    return { tipo: "em_processamento" as const };
  }

  async concluirOperacao(dados: Parameters<RepositorioConfirmacoesFerramentas["concluirOperacao"]>[0]) {
    await dbTransacional.update(atendimentoIaOperacoesProtegidasTable).set({
      atualizadoEm: new Date(), concluidoEm: new Date(), resultado: dados.resultado, status: "concluida",
    }).where(and(eq(atendimentoIaOperacoesProtegidasTable.id, dados.operacaoId), eq(atendimentoIaOperacoesProtegidasTable.status, "processando")));
  }

  async falharOperacao(dados: Parameters<RepositorioConfirmacoesFerramentas["falharOperacao"]>[0]) {
    await dbTransacional.update(atendimentoIaOperacoesProtegidasTable).set({
      atualizadoEm: new Date(), concluidoEm: new Date(),
      erroSanitizado: dados.resultadoIncerto ? "resultado_incerto" : "falha_sem_execucao",
      status: dados.resultadoIncerto ? "resultado_incerto" : "falha_sem_execucao",
    }).where(and(eq(atendimentoIaOperacoesProtegidasTable.id, dados.operacaoId), eq(atendimentoIaOperacoesProtegidasTable.status, "processando")));
  }

  async auditar(evento: string, dados: Record<string, unknown>) {
    await new RepositorioSegurancaObservabilidadeDrizzle().registrar({
      categoria: evento.includes("falhou") ? "integracao" : "operacao",
      correlacaoId: criarCorrelacaoSegura(),
      evento,
      metadados: dados,
      referenciaSessaoHash: typeof dados.referenciaSessaoHash === "string" ? dados.referenciaSessaoHash : undefined,
      resultado: evento.includes("cancelada") ? "cancelamento" : evento.includes("falhou") ? "falha" : evento.includes("invalida") ? "recusa" : "sucesso_comprovado",
      severidade: evento.includes("falhou") || evento.includes("invalida") ? "atencao" : "informativo",
      tipoAtor: "sistema",
      usuarioId: typeof dados.usuarioId === "string" ? dados.usuarioId : undefined,
    });
  }
}
