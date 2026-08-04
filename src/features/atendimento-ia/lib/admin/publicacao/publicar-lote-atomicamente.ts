import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import {
  atendimentoIaComportamentoVersoesTable,
  atendimentoIaDocumentoVersoesTable,
  atendimentoIaFragmentosInstitucionaisTable,
  atendimentoIaPublicacoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type { ConfiguracaoRag } from "../../../schemas/configuracao-rag.schema";
import type { ClienteEmbeddingsRag } from "../../../types/rag";
import { montarInstrucoesPublicadas } from "./montar-instrucoes-publicadas";
import {
  calcularHashRequisicaoPublicacao,
  validarRepeticaoPublicacao,
} from "./politica-idempotencia-publicacao";
import {
  prepararFragmentosCandidatos,
  validarEmbeddingsPublicacao,
} from "./preparar-fragmentos-candidatos";
import { registrarPublicacao } from "./registrar-publicacao";

export async function publicarLoteAtomicamente(dados: {
  atorId: string;
  chaveIdempotencia: string;
  clienteEmbeddings: ClienteEmbeddingsRag;
  configuracao: ConfiguracaoRag;
  identidade: string;
  justificativaAlertas?: string;
  itens: Array<{ id: string; hash: string; ordem: number }>;
  revalidarElegibilidade: () => Promise<{ identidadeCandidato: string }>;
}) {
  const congelados = [...dados.itens].sort((a, b) => a.ordem - b.ordem);
  const hashRequisicao = calcularHashRequisicaoPublicacao({
    identidade: dados.identidade,
    itens: congelados,
    justificativa: dados.justificativaAlertas ?? null,
  });
  const [existente] = await dbTransacional
    .select()
    .from(atendimentoIaPublicacoesTable)
    .where(
      eq(
        atendimentoIaPublicacoesTable.chaveIdempotencia,
        dados.chaveIdempotencia,
      ),
    )
    .limit(1);
  if (existente)
    return {
      idempotente:
        validarRepeticaoPublicacao(existente, hashRequisicao) === "concluida",
      publicacao: existente,
    };
  const ids = congelados.map((i) => i.id);
  const [conhecimentos, comportamentos] = await Promise.all([
    dbTransacional
      .select()
      .from(atendimentoIaDocumentoVersoesTable)
      .where(inArray(atendimentoIaDocumentoVersoesTable.id, ids)),
    dbTransacional
      .select()
      .from(atendimentoIaComportamentoVersoesTable)
      .where(inArray(atendimentoIaComportamentoVersoesTable.id, ids)),
  ]);
  if (conhecimentos.length + comportamentos.length !== ids.length)
    throw new Error("LOTE_INTEGRANTES_INVALIDOS");
  const preparados = await Promise.all(
    conhecimentos.map(async (versao) => {
      if (versao.estado !== "em_revisao" || !versao.revisadoEm)
        throw new Error("LOTE_NAO_PUBLICAVEL");
      const base = prepararFragmentosCandidatos(
        versao.conteudo,
        versao.hashConteudo,
        dados.configuracao,
      );
      const embeddings: number[][] = [];
      for (
        let i = 0;
        i < base.fragmentos.length;
        i += dados.configuracao.OPENAI_RAG_TAMANHO_LOTE
      ) {
        const lote = base.fragmentos.slice(
          i,
          i + dados.configuracao.OPENAI_RAG_TAMANHO_LOTE,
        );
        embeddings.push(
          ...(await dados.clienteEmbeddings.gerar({
            dimensao: dados.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
            entradas: lote.map((f) => f.conteudo),
            modelo: dados.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
            timeoutEmMs: dados.configuracao.OPENAI_RAG_TIMEOUT_MS,
          })),
        );
      }
      validarEmbeddingsPublicacao(
        embeddings,
        base.fragmentos.length,
        dados.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
      );
      return { base, embeddings, versao };
    }),
  );
  comportamentos.forEach((v) => {
    if (v.estado !== "em_revisao" || !v.revisadoEm)
      throw new Error("LOTE_NAO_PUBLICAVEL");
    montarInstrucoesPublicadas(v.configuracaoEstruturada);
  });
  return dbTransacional.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${dados.identidade}))`,
    );
    const elegibilidadeAtual = await dados.revalidarElegibilidade();
    if (elegibilidadeAtual.identidadeCandidato !== dados.identidade)
      throw new Error("ELEGIBILIDADE_ALTERADA");
    const agora = new Date();
    const itensRegistro: Array<{
      candidatoId: string;
      hash: string;
      ordem: number;
      tipo: string;
      versaoAnteriorId?: string | null;
    }> = [];
    for (const item of congelados) {
      const conhecimento = preparados.find((p) => p.versao.id === item.id);
      if (conhecimento) {
        if (conhecimento.versao.hashConteudo !== item.hash)
          throw new Error("HASH_LOTE_DIVERGENTE");
        const [atual] = await tx
          .select()
          .from(atendimentoIaDocumentoVersoesTable)
          .where(eq(atendimentoIaDocumentoVersoesTable.id, item.id))
          .limit(1);
        if (
          !atual ||
          atual.estado !== "em_revisao" ||
          atual.hashConteudo !== item.hash
        )
          throw new Error("LOTE_CANDIDATO_ALTERADO");
        const [anterior] = await tx
          .select({ id: atendimentoIaDocumentoVersoesTable.id })
          .from(atendimentoIaDocumentoVersoesTable)
          .where(
            and(
              eq(
                atendimentoIaDocumentoVersoesTable.documentoId,
                atual.documentoId,
              ),
              eq(atendimentoIaDocumentoVersoesTable.estado, "publicado"),
            ),
          )
          .limit(1);
        await tx
          .delete(atendimentoIaFragmentosInstitucionaisTable)
          .where(
            and(
              eq(
                atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId,
                atual.id,
              ),
              eq(atendimentoIaFragmentosInstitucionaisTable.ativo, false),
            ),
          );
        await tx
          .insert(atendimentoIaFragmentosInstitucionaisTable)
          .values(
            conhecimento.base.fragmentos.map((f, i) => ({
              ...f,
              ativo: false,
              dimensaoEmbedding:
                dados.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
              embedding: conhecimento.embeddings[i]!,
              indexadoEm: agora,
              modeloEmbedding: dados.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
              versaoDocumentoId: atual.id,
            })),
          );
        if (anterior) {
          await tx
            .update(atendimentoIaFragmentosInstitucionaisTable)
            .set({ ativo: false, atualizadoEm: agora })
            .where(
              eq(
                atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId,
                anterior.id,
              ),
            );
          await tx
            .update(atendimentoIaDocumentoVersoesTable)
            .set({
              estado: "desativado",
              desativadoEm: agora,
              atualizadoEm: agora,
            })
            .where(eq(atendimentoIaDocumentoVersoesTable.id, anterior.id));
        }
        await tx
          .update(atendimentoIaDocumentoVersoesTable)
          .set({
            estado: "publicado",
            publicadoEm: agora,
            statusIndexacao: "concluida",
            modeloEmbedding: dados.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
            dimensaoEmbedding: dados.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
            hashIndexacao: conhecimento.base.hashIndexacao,
            indexadoEm: agora,
            atualizadoEm: agora,
          })
          .where(eq(atendimentoIaDocumentoVersoesTable.id, atual.id));
        await tx
          .update(atendimentoIaFragmentosInstitucionaisTable)
          .set({ ativo: true, atualizadoEm: agora })
          .where(
            eq(
              atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId,
              atual.id,
            ),
          );
        itensRegistro.push({
          candidatoId: item.id,
          hash: item.hash,
          ordem: item.ordem,
          tipo: "conhecimento",
          versaoAnteriorId: anterior?.id,
        });
      } else {
        const comportamento = comportamentos.find((v) => v.id === item.id);
        if (!comportamento || comportamento.hash !== item.hash)
          throw new Error("HASH_LOTE_DIVERGENTE");
        const [atual] = await tx
          .select()
          .from(atendimentoIaComportamentoVersoesTable)
          .where(eq(atendimentoIaComportamentoVersoesTable.id, item.id))
          .limit(1);
        if (!atual || atual.estado !== "em_revisao" || atual.hash !== item.hash)
          throw new Error("LOTE_CANDIDATO_ALTERADO");
        const [anterior] = await tx
          .select({ id: atendimentoIaComportamentoVersoesTable.id })
          .from(atendimentoIaComportamentoVersoesTable)
          .where(
            and(
              eq(
                atendimentoIaComportamentoVersoesTable.comportamentoId,
                atual.comportamentoId,
              ),
              eq(atendimentoIaComportamentoVersoesTable.estado, "publicado"),
            ),
          )
          .limit(1);
        if (anterior)
          await tx
            .update(atendimentoIaComportamentoVersoesTable)
            .set({ estado: "desativado", atualizadoEm: agora })
            .where(eq(atendimentoIaComportamentoVersoesTable.id, anterior.id));
        await tx
          .update(atendimentoIaComportamentoVersoesTable)
          .set({ estado: "publicado", atualizadoEm: agora })
          .where(eq(atendimentoIaComportamentoVersoesTable.id, atual.id));
        itensRegistro.push({
          candidatoId: item.id,
          hash: item.hash,
          ordem: item.ordem,
          tipo: "comportamento",
          versaoAnteriorId: anterior?.id,
        });
      }
    }
    const publicacao = await registrarPublicacao(tx, {
      atorId: dados.atorId,
      chaveIdempotencia: dados.chaveIdempotencia,
      hashRequisicao,
      identidade: dados.identidade,
      justificativaAlertas: dados.justificativaAlertas,
      tipo: "lote",
      itens: itensRegistro,
    });
    return { idempotente: false, publicacao };
  });
}
