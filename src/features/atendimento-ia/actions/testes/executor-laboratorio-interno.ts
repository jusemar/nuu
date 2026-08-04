import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { z } from "zod";

import {
  atendimentoIaCasoTesteVersoesTable,
  atendimentoIaComportamentoVersoesTable,
  atendimentoIaConjuntoTesteCasosTable,
  atendimentoIaDocumentoVersoesTable,
  atendimentoIaExecucoesLaboratorioTable,
  atendimentoIaResultadosLaboratorioTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { executarComparacaoLaboratorio } from "../../lib/admin/laboratorio/executor-laboratorio";
import { montarSnapshotCandidato } from "../../lib/admin/laboratorio/montar-snapshot-candidato";
import { montarSnapshotPublicado } from "../../lib/admin/laboratorio/montar-snapshot-publicado";
import { sanitizarResultadoLaboratorio } from "../../lib/admin/laboratorio/sanitizar-resultado-laboratorio";
import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { ClienteResponsesOpenAiOficial } from "../../lib/cliente-responses-openai";
import type { executarLaboratorioSchema } from "../../schemas/admin/laboratorio.schema";
import { configuracaoOpenAiSchema } from "../../schemas/configuracao-openai.schema";
type Entrada = z.infer<typeof executarLaboratorioSchema>;
const expiraEm = () => {
  const data = new Date();
  data.setMonth(data.getMonth() + 12);
  return data;
};
export async function prepararExecucaoLaboratorio(
  d: Entrada,
  atorId: string,
  modo: "sincrono" | "assincrono",
  casosIds: string[],
) {
  return dbTransacional.transaction(async (tx) => {
    const [duplicada] = await tx
      .select({ id: atendimentoIaExecucoesLaboratorioTable.id })
      .from(atendimentoIaExecucoesLaboratorioTable)
      .where(
        eq(
          atendimentoIaExecucoesLaboratorioTable.chaveIdempotencia,
          d.chaveIdempotencia,
        ),
      )
      .limit(1);
    if (duplicada) throw new Error("EXECUCAO_DUPLICADA_BLOQUEADA");
    const conhecimentoCandidato = d.versaoCandidataConhecimentoId
      ? (
          await tx
            .select()
            .from(atendimentoIaDocumentoVersoesTable)
            .where(
              eq(
                atendimentoIaDocumentoVersoesTable.id,
                d.versaoCandidataConhecimentoId,
              ),
            )
            .limit(1)
        )[0]
      : null;
    const comportamentoCandidato = d.versaoCandidataComportamentoId
      ? (
          await tx
            .select()
            .from(atendimentoIaComportamentoVersoesTable)
            .where(
              eq(
                atendimentoIaComportamentoVersoesTable.id,
                d.versaoCandidataComportamentoId,
              ),
            )
            .limit(1)
        )[0]
      : null;
    if (d.versaoCandidataConhecimentoId && !conhecimentoCandidato)
      throw new Error("CONHECIMENTO_CANDIDATO_INVALIDO");
    if (d.versaoCandidataComportamentoId && !comportamentoCandidato)
      throw new Error("COMPORTAMENTO_CANDIDATO_INVALIDO");
    const [publicado] = conhecimentoCandidato
      ? await tx
          .select()
          .from(atendimentoIaDocumentoVersoesTable)
          .where(
            and(
              eq(
                atendimentoIaDocumentoVersoesTable.documentoId,
                conhecimentoCandidato.documentoId,
              ),
              eq(atendimentoIaDocumentoVersoesTable.estado, "publicado"),
            ),
          )
          .orderBy(desc(atendimentoIaDocumentoVersoesTable.versao))
          .limit(1)
      : [];
    const snapshotPublicado = montarSnapshotPublicado(
      publicado
        ? {
            id: publicado.id,
            estado: publicado.estado,
            hash: publicado.hashConteudo,
            conteudo: publicado.conteudo,
          }
        : null,
      null,
    );
    const snapshotCandidato = montarSnapshotCandidato(
      conhecimentoCandidato
        ? {
            id: conhecimentoCandidato.id,
            hash: conhecimentoCandidato.hashConteudo,
            conteudo: conhecimentoCandidato.conteudo,
          }
        : null,
      comportamentoCandidato
        ? {
            id: comportamentoCandidato.id,
            hash: comportamentoCandidato.hash,
            instrucoes: JSON.stringify({
              configuracao: comportamentoCandidato.configuracaoEstruturada,
              blocos: comportamentoCandidato.blocosAdministrativos,
            }),
          }
        : null,
    );
    const hashes = {
      publicadoConhecimento:
        snapshotPublicado.conhecimento?.hash ?? "sem_publicado",
      candidatoConhecimento:
        snapshotCandidato.conhecimento?.hash ?? "sem_candidato",
      publicadoComportamento: "baseline_tecnica_protegida",
      candidatoComportamento:
        snapshotCandidato.comportamento?.hash ?? "sem_candidato",
    };
    const [execucao] = await tx
      .insert(atendimentoIaExecucoesLaboratorioTable)
      .values({
        tipoComparacao: d.tipoComparacao,
        modoExecucao: modo,
        versaoPublicadaConhecimentoId: publicado?.id,
        versaoCandidataConhecimentoId: conhecimentoCandidato?.id,
        versaoCandidataComportamentoId: comportamentoCandidato?.id,
        conjuntoTesteId: d.conjuntoTesteId,
        casoTesteVersaoId: d.casoTesteVersaoId,
        status: modo === "sincrono" ? "processando" : "pendente",
        configuracaoCongelada: {
          casosIds,
          snapshotPublicado,
          snapshotCandidato,
          modelo: "gpt-5.6-terra",
          efeitosReais: "proibidos",
        },
        hashesCongelados: hashes,
        chaveIdempotencia: d.chaveIdempotencia,
        solicitadoPorId: atorId,
        iniciadoEm: modo === "sincrono" ? new Date() : null,
        expiraEm: expiraEm(),
      })
      .returning({ id: atendimentoIaExecucoesLaboratorioTable.id });
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "iniciar_laboratorio",
      atorId,
      evento: "atendimento_ia_laboratorio_iniciado",
      metadados: {
        execucaoId: execucao!.id,
        modo,
        quantidadeCasos: casosIds.length,
      },
      resultado: "sucesso_comprovado",
    });
    return { execucaoId: execucao!.id, snapshotPublicado, snapshotCandidato };
  });
}
export async function resolverCasos(d: Entrada) {
  if (d.casoTesteVersaoId) return [d.casoTesteVersaoId];
  const vinculos = await dbTransacional
    .select({ id: atendimentoIaConjuntoTesteCasosTable.casoTesteVersaoId })
    .from(atendimentoIaConjuntoTesteCasosTable)
    .where(
      eq(
        atendimentoIaConjuntoTesteCasosTable.conjuntoTesteId,
        d.conjuntoTesteId!,
      ),
    )
    .orderBy(asc(atendimentoIaConjuntoTesteCasosTable.ordem));
  return vinculos.map((v) => v.id);
}
export async function processarExecucao(
  execucaoId: string,
  casosIds: string[],
  snapshots: {
    snapshotPublicado: ReturnType<typeof montarSnapshotPublicado>;
    snapshotCandidato: ReturnType<typeof montarSnapshotCandidato>;
  },
) {
  const cliente = new ClienteResponsesOpenAiOficial(
    configuracaoOpenAiSchema.parse(process.env).OPENAI_API_KEY,
  );
  let totalEntrada = 0,
    totalSaida = 0,
    custo = 0;
  try {
    const casos = await dbTransacional
      .select()
      .from(atendimentoIaCasoTesteVersoesTable)
      .where(inArray(atendimentoIaCasoTesteVersoesTable.id, casosIds));
    for (const caso of casos) {
      if (caso.estado !== "aprovado")
        throw new Error("CASO_TESTE_NAO_APROVADO");
      const entrada = caso.entradaControlada as { perguntaCliente?: string };
      const resultado = await executarComparacaoLaboratorio(cliente, {
        pergunta: entrada.perguntaCliente ?? "",
        criterios: caso.criterios,
        contextoSimulado: caso.contextoSimulado,
        ...snapshots,
      });
      totalEntrada += resultado.tokensEntrada;
      totalSaida += resultado.tokensSaida;
      custo += resultado.custoEstimado;
      await dbTransacional
        .insert(atendimentoIaResultadosLaboratorioTable)
        .values({
          execucaoLaboratorioId: execucaoId,
          casoTesteVersaoId: caso.id,
          respostaPublicada: resultado.respostaPublicada,
          respostaCandidata: resultado.respostaCandidata,
          conhecimentosUsadosPublicada: resultado.conhecimentosUsadosPublicada,
          conhecimentosUsadosCandidata: resultado.conhecimentosUsadosCandidata,
          conflitos: resultado.conflitos ?? [],
          fontesAusentes: resultado.fontesAusentes ?? [],
          ferramentasSolicitadas: resultado.ferramentasSolicitadas,
          ferramentasSimuladas: resultado.ferramentasSimuladas,
          necessidadeConsultaReal: resultado.necessidadeConsultaReal,
          violacoes: resultado.violacoes ?? [],
          resultadoAutomatico: resultado.resultadoAutomatico,
          tokens: resultado.tokensEntrada + resultado.tokensSaida,
          duracao: resultado.duracao,
        });
    }
    await dbTransacional
      .update(atendimentoIaExecucoesLaboratorioTable)
      .set({
        status: "concluida",
        concluidoEm: new Date(),
        tokensEntrada: totalEntrada,
        tokensSaida: totalSaida,
        custoEstimado: String(custo),
        atualizadoEm: new Date(),
      })
      .where(eq(atendimentoIaExecucoesLaboratorioTable.id, execucaoId));
  } catch (erro) {
    await dbTransacional
      .update(atendimentoIaExecucoesLaboratorioTable)
      .set({
        status: "falhou",
        concluidoEm: new Date(),
        erroSanitizado: sanitizarResultadoLaboratorio(erro),
        atualizadoEm: new Date(),
      })
      .where(eq(atendimentoIaExecucoesLaboratorioTable.id, execucaoId));
    throw erro;
  }
}
