import "server-only";

import { and, count, desc, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaCasosTesteTable,
  atendimentoIaCasoTesteVersoesTable,
  atendimentoIaComportamentoVersoesTable,
  atendimentoIaConjuntoTesteCasosTable,
  atendimentoIaDocumentoVersoesTable,
  atendimentoIaExecucoesLaboratorioTable,
  atendimentoIaPapeisAdminTable,
  atendimentoIaResultadosLaboratorioTable,
} from "@/db/schema";

import { calcularIdentidadeCandidato } from "../../../lib/admin/publicacao/calcular-identidade-candidato";
import type {
  EntradaElegibilidadePublicacao,
  EvidenciaResultadoLaboratorio,
  TipoCandidatoPublicacao,
} from "../../../types/admin/publicacao";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function buscarEvidenciasElegibilidadeAdmin({
  candidatoId,
  tipo,
  conjuntoTesteId,
}: {
  candidatoId: string;
  tipo: TipoCandidatoPublicacao;
  conjuntoTesteId?: string;
}): Promise<EntradaElegibilidadePublicacao> {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  if (tipo === "lote") {
    const [execucao] = await db
      .select()
      .from(atendimentoIaExecucoesLaboratorioTable)
      .where(eq(atendimentoIaExecucoesLaboratorioTable.id, candidatoId))
      .limit(1);
    if (!execucao) throw new Error("LOTE_NAO_ENCONTRADO");
    const integrantes = [
      ...(execucao.versaoCandidataConhecimentoId
        ? [
            {
              id: execucao.versaoCandidataConhecimentoId,
              tipo: "conhecimento" as const,
              hash:
                execucao.hashesCongelados.candidatoConhecimento ?? "ausente",
              ordem: 1,
            },
          ]
        : []),
      ...(execucao.versaoCandidataComportamentoId
        ? [
            {
              id: execucao.versaoCandidataComportamentoId,
              tipo: "comportamento" as const,
              hash:
                execucao.hashesCongelados.candidatoComportamento ?? "ausente",
              ordem: 2,
            },
          ]
        : []),
    ];
    if (!integrantes.length) throw new Error("LOTE_SEM_INTEGRANTES");
    const evidencias = await Promise.all(
      integrantes.map((item) =>
        buscarEvidenciasElegibilidadeAdmin({
          candidatoId: item.id,
          tipo: item.tipo,
          conjuntoTesteId: execucao.conjuntoTesteId ?? undefined,
        }),
      ),
    );
    const itensLote = await Promise.all(
      integrantes.map(async (item) => {
        const [numero] =
          item.tipo === "conhecimento"
            ? await db
                .select({ valor: atendimentoIaDocumentoVersoesTable.versao })
                .from(atendimentoIaDocumentoVersoesTable)
                .where(eq(atendimentoIaDocumentoVersoesTable.id, item.id))
                .limit(1)
            : await db
                .select({
                  valor: atendimentoIaComportamentoVersoesTable.numeroVersao,
                })
                .from(atendimentoIaComportamentoVersoesTable)
                .where(eq(atendimentoIaComportamentoVersoesTable.id, item.id))
                .limit(1);
        if (!numero) throw new Error("VERSAO_LOTE_NAO_ENCONTRADA");
        return {
          id: item.id,
          versao: numero.valor,
          hash: item.hash,
          ordem: item.ordem,
        };
      }),
    );
    const hashLote = calcularIdentidadeCandidato({
      tipo: "lote",
      candidatoId,
      hashAtual: "composicao_congelada",
      itensLote,
      comportamentoCandidato:
        integrantes.find((i) => i.tipo === "comportamento") ?? null,
      conjuntoTesteId: execucao.conjuntoTesteId,
    });
    const revisoesValidas = evidencias.every(
      (item) =>
        item.revisao.estado === "aprovada" &&
        item.revisao.aprovadorTinhaCapacidade,
    );
    return {
      tipo: "lote",
      candidatoId,
      hashAtual: hashLote,
      itensLote,
      comportamentoCandidato:
        integrantes.find((i) => i.tipo === "comportamento") ?? null,
      conjuntoTesteId: execucao.conjuntoTesteId,
      revisao: {
        estado: revisoesValidas ? "aprovada" : "ausente",
        hashAprovado: revisoesValidas ? hashLote : null,
        aprovadorId: "aprovacoes_individuais",
        aprovadorTinhaCapacidade: revisoesValidas,
        autorId: null,
        outrosDecisoresAtivos: 0,
        revisadoEm: revisoesValidas
          ? new Date(
              Math.max(
                ...evidencias.map(
                  (item) => item.revisao.revisadoEm?.getTime() ?? 0,
                ),
              ),
            )
          : null,
        atualizadoEm: new Date(
          Math.max(
            ...evidencias.map((item) => item.revisao.atualizadoEm.getTime()),
          ),
        ),
      },
      resultados: evidencias
        .flatMap((item) => item.resultados)
        .filter(
          (item, indice, todos) =>
            todos.findIndex(
              (outro) =>
                outro.execucaoId === item.execucaoId &&
                outro.casoTesteVersaoId === item.casoTesteVersaoId,
            ) === indice,
        )
        .map((item) => ({
          ...item,
          hashesCongelados: { ...item.hashesCongelados, lote: hashLote },
        })),
      casosObrigatorios: evidencias
        .flatMap((item) => item.casosObrigatorios)
        .filter(
          (item, indice, todos) =>
            todos.findIndex((outro) => outro.id === item.id) === indice,
        ),
    };
  }
  const comportamento = tipo === "comportamento";
  const [versao] = comportamento
    ? await db
        .select({
          atualizadoEm: atendimentoIaComportamentoVersoesTable.atualizadoEm,
          autorId: atendimentoIaComportamentoVersoesTable.criadoPorId,
          hash: atendimentoIaComportamentoVersoesTable.hash,
          motivoReprovacao:
            atendimentoIaComportamentoVersoesTable.motivoReprovacao,
          revisadoEm: atendimentoIaComportamentoVersoesTable.revisadoEm,
          revisadoPorId: atendimentoIaComportamentoVersoesTable.revisadoPorId,
        })
        .from(atendimentoIaComportamentoVersoesTable)
        .where(eq(atendimentoIaComportamentoVersoesTable.id, candidatoId))
        .limit(1)
    : await db
        .select({
          atualizadoEm: atendimentoIaDocumentoVersoesTable.atualizadoEm,
          autorId: atendimentoIaDocumentoVersoesTable.criadoPorId,
          hash: atendimentoIaDocumentoVersoesTable.hashConteudo,
          motivoReprovacao: atendimentoIaDocumentoVersoesTable.motivoReprovacao,
          revisadoEm: atendimentoIaDocumentoVersoesTable.revisadoEm,
          revisadoPorId:
            atendimentoIaDocumentoVersoesTable.responsavelRevisaoId,
        })
        .from(atendimentoIaDocumentoVersoesTable)
        .where(eq(atendimentoIaDocumentoVersoesTable.id, candidatoId))
        .limit(1);
  if (!versao) throw new Error("CANDIDATO_NAO_ENCONTRADO");
  const [papel, outros] = await Promise.all([
    versao.revisadoPorId
      ? db
          .select({ papel: atendimentoIaPapeisAdminTable.papel })
          .from(atendimentoIaPapeisAdminTable)
          .where(
            and(
              eq(atendimentoIaPapeisAdminTable.usuarioId, versao.revisadoPorId),
              eq(atendimentoIaPapeisAdminTable.ativo, true),
              inArray(atendimentoIaPapeisAdminTable.papel, [
                "gestor_principal",
                "revisor",
              ]),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
    db
      .select({ total: count() })
      .from(atendimentoIaPapeisAdminTable)
      .where(
        and(
          eq(atendimentoIaPapeisAdminTable.ativo, true),
          inArray(atendimentoIaPapeisAdminTable.papel, [
            "gestor_principal",
            "revisor",
          ]),
          versao.revisadoPorId
            ? ne(atendimentoIaPapeisAdminTable.usuarioId, versao.revisadoPorId)
            : undefined,
        ),
      ),
  ]);
  const execucoes = await db
    .select()
    .from(atendimentoIaExecucoesLaboratorioTable)
    .where(
      comportamento
        ? eq(
            atendimentoIaExecucoesLaboratorioTable.versaoCandidataComportamentoId,
            candidatoId,
          )
        : eq(
            atendimentoIaExecucoesLaboratorioTable.versaoCandidataConhecimentoId,
            candidatoId,
          ),
    )
    .orderBy(desc(atendimentoIaExecucoesLaboratorioTable.criadoEm))
    .limit(20);
  const resultados: EvidenciaResultadoLaboratorio[] = [];
  for (const execucao of execucoes) {
    const itens = await db
      .select({
        casoTesteVersaoId:
          atendimentoIaResultadosLaboratorioTable.casoTesteVersaoId,
        conflitos: atendimentoIaResultadosLaboratorioTable.conflitos,
        fontesAusentes: atendimentoIaResultadosLaboratorioTable.fontesAusentes,
        necessidadeConsultaReal:
          atendimentoIaResultadosLaboratorioTable.necessidadeConsultaReal,
        resultadoAutomatico:
          atendimentoIaResultadosLaboratorioTable.resultadoAutomatico,
        decisaoHumana: atendimentoIaResultadosLaboratorioTable.decisaoHumana,
        violacoes: atendimentoIaResultadosLaboratorioTable.violacoes,
        criticidade: atendimentoIaCasosTesteTable.criticidade,
      })
      .from(atendimentoIaResultadosLaboratorioTable)
      .innerJoin(
        atendimentoIaCasoTesteVersoesTable,
        eq(
          atendimentoIaResultadosLaboratorioTable.casoTesteVersaoId,
          atendimentoIaCasoTesteVersoesTable.id,
        ),
      )
      .innerJoin(
        atendimentoIaCasosTesteTable,
        eq(
          atendimentoIaCasoTesteVersoesTable.casoTesteId,
          atendimentoIaCasosTesteTable.id,
        ),
      )
      .where(
        eq(
          atendimentoIaResultadosLaboratorioTable.execucaoLaboratorioId,
          execucao.id,
        ),
      );
    for (const item of itens)
      resultados.push({
        execucaoId: execucao.id,
        status: execucao.status,
        hashesCongelados: execucao.hashesCongelados,
        resultado: item.decisaoHumana ?? item.resultadoAutomatico,
        criticidade: item.criticidade,
        obrigatorio: true,
        bloqueiaPublicacao: item.criticidade === "critica",
        conflitos: item.conflitos,
        fontesAusentes: item.fontesAusentes,
        necessidadeConsultaReal: item.necessidadeConsultaReal,
        violacoes: item.violacoes,
        casoTesteVersaoId: item.casoTesteVersaoId,
      });
  }
  const casosObrigatorios = conjuntoTesteId
    ? await db
        .select({
          id: atendimentoIaConjuntoTesteCasosTable.casoTesteVersaoId,
          criticidade: atendimentoIaCasosTesteTable.criticidade,
          obrigatorio: atendimentoIaConjuntoTesteCasosTable.obrigatorio,
          bloqueiaPublicacao:
            atendimentoIaConjuntoTesteCasosTable.bloqueiaPublicacao,
        })
        .from(atendimentoIaConjuntoTesteCasosTable)
        .innerJoin(
          atendimentoIaCasoTesteVersoesTable,
          eq(
            atendimentoIaConjuntoTesteCasosTable.casoTesteVersaoId,
            atendimentoIaCasoTesteVersoesTable.id,
          ),
        )
        .innerJoin(
          atendimentoIaCasosTesteTable,
          eq(
            atendimentoIaCasoTesteVersoesTable.casoTesteId,
            atendimentoIaCasosTesteTable.id,
          ),
        )
        .where(
          eq(
            atendimentoIaConjuntoTesteCasosTable.conjuntoTesteId,
            conjuntoTesteId,
          ),
        )
    : [];
  const aprovada = Boolean(
    versao.revisadoEm && versao.revisadoPorId && !versao.motivoReprovacao,
  );
  return {
    tipo,
    candidatoId,
    hashAtual: versao.hash,
    conjuntoTesteId,
    revisao: {
      estado: versao.motivoReprovacao
        ? "reprovada"
        : aprovada
          ? "aprovada"
          : "ausente",
      hashAprovado: aprovada ? versao.hash : null,
      aprovadorId: versao.revisadoPorId,
      aprovadorTinhaCapacidade: papel.length > 0,
      autorId: versao.autorId,
      outrosDecisoresAtivos: outros[0]?.total ?? 0,
      revisadoEm: versao.revisadoEm,
      atualizadoEm: versao.atualizadoEm,
    },
    resultados,
    casosObrigatorios,
  };
}
