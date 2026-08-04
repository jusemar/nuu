import "server-only";

import { createHash } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";

import {
  atendimentoIaBuscasRagTable,
  atendimentoIaDocumentosInstitucionaisTable,
  atendimentoIaDocumentoVersoesTable,
  atendimentoIaExecucoesTable,
  atendimentoIaFragmentosInstitucionaisTable,
  atendimentoIaPublicacaoItensTable,
  atendimentoIaPublicacoesTable,
  atendimentoIaResultadosRagTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type { ConfiguracaoRag } from "../schemas/configuracao-rag.schema";
import type {
  CandidatoRag,
  FragmentoInstitucional,
  ResultadoRecuperacaoRag,
} from "../types/rag";

function vetorSql(vetor: number[]) {
  return `[${vetor.join(",")}]`;
}

export class RepositorioConhecimentoInstitucionalDrizzle {
  async possuiBasePublicadaCompativel(dados: {
    dimensao: number;
    modelo: string;
  }) {
    const publicacoesAdminAtivas =
      process.env.ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS === "true";
    const filtro = publicacoesAdminAtivas
      ? sql`f.ativo=true and v.estado='publicado' and exists (select 1 from atendimento_ia_publicacao_itens pi join atendimento_ia_publicacoes p on p.id=pi.publicacao_id where pi.candidato_id=v.id and p.status='concluida')`
      : sql`((f.ativo=true and v.estado='publicado' and not exists (select 1 from atendimento_ia_publicacao_itens pi where pi.candidato_id=v.id)) or (not f.ativo and exists (select 1 from atendimento_ia_publicacao_itens pi join atendimento_ia_publicacoes p on p.id=pi.publicacao_id where pi.versao_anterior_id=v.id and p.status='concluida') and not exists (select 1 from atendimento_ia_publicacao_itens propria where propria.candidato_id=v.id)))`;
    const resultado = await dbTransacional.execute(
      sql`select count(*)::int quantidade from atendimento_ia_fragmentos_institucionais f join atendimento_ia_documento_versoes v on v.id=f.versao_documento_id where ${filtro} and f.modelo_embedding=${dados.modelo} and f.dimensao_embedding=${dados.dimensao}`,
    );
    return Number(resultado.rows[0]?.quantidade ?? 0) > 0;
  }

  async criarVersao(dados: {
    categoria: string;
    chaveEstavel: string;
    conteudo: string;
    hashConteudo: string;
    metadados: Record<string, unknown>;
    origem: string;
    titulo: string;
  }) {
    return dbTransacional.transaction(async (tx) => {
      await tx
        .insert(atendimentoIaDocumentosInstitucionaisTable)
        .values({
          categoria: dados.categoria,
          chaveEstavel: dados.chaveEstavel,
          metadados: dados.metadados,
          origem: dados.origem,
        })
        .onConflictDoNothing({
          target: atendimentoIaDocumentosInstitucionaisTable.chaveEstavel,
        });
      const [documento] = await tx
        .select()
        .from(atendimentoIaDocumentosInstitucionaisTable)
        .where(
          eq(
            atendimentoIaDocumentosInstitucionaisTable.chaveEstavel,
            dados.chaveEstavel,
          ),
        )
        .limit(1);
      if (!documento) throw new Error("DOCUMENTO_INSTITUCIONAL_INDISPONIVEL");
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${documento.id}))`,
      );
      const [anterior] = await tx
        .select({
          id: atendimentoIaDocumentoVersoesTable.id,
          versao: atendimentoIaDocumentoVersoesTable.versao,
        })
        .from(atendimentoIaDocumentoVersoesTable)
        .where(eq(atendimentoIaDocumentoVersoesTable.documentoId, documento.id))
        .orderBy(desc(atendimentoIaDocumentoVersoesTable.versao))
        .limit(1);
      const [versao] = await tx
        .insert(atendimentoIaDocumentoVersoesTable)
        .values({
          conteudo: dados.conteudo,
          documentoId: documento.id,
          hashConteudo: dados.hashConteudo,
          metadados: dados.metadados,
          titulo: dados.titulo,
          versao: (anterior?.versao ?? 0) + 1,
          versaoAnteriorId: anterior?.id ?? null,
        })
        .returning();
      if (!versao) throw new Error("VERSAO_INSTITUCIONAL_INDISPONIVEL");
      return { documento, versao };
    });
  }

  async enviarParaRevisao(versaoId: string) {
    const [versao] = await dbTransacional
      .update(atendimentoIaDocumentoVersoesTable)
      .set({ atualizadoEm: new Date(), estado: "em_revisao" })
      .where(
        and(
          eq(atendimentoIaDocumentoVersoesTable.id, versaoId),
          eq(atendimentoIaDocumentoVersoesTable.estado, "rascunho"),
        ),
      )
      .returning();
    if (!versao) throw new Error("TRANSICAO_EDITORIAL_INVALIDA");
    return versao;
  }

  async buscarVersao(versaoId: string) {
    const [versao] = await dbTransacional
      .select()
      .from(atendimentoIaDocumentoVersoesTable)
      .where(eq(atendimentoIaDocumentoVersoesTable.id, versaoId))
      .limit(1);
    return versao ?? null;
  }

  async buscarIndexacaoConcluida(versaoId: string, hashIndexacao: string) {
    const [versao] = await dbTransacional
      .select()
      .from(atendimentoIaDocumentoVersoesTable)
      .where(
        and(
          eq(atendimentoIaDocumentoVersoesTable.id, versaoId),
          eq(atendimentoIaDocumentoVersoesTable.hashIndexacao, hashIndexacao),
          eq(atendimentoIaDocumentoVersoesTable.statusIndexacao, "concluida"),
        ),
      )
      .limit(1);
    return versao ?? null;
  }

  async iniciarIndexacao(versaoId: string) {
    const [versao] = await dbTransacional
      .update(atendimentoIaDocumentoVersoesTable)
      .set({ atualizadoEm: new Date(), statusIndexacao: "processando" })
      .where(
        and(
          eq(atendimentoIaDocumentoVersoesTable.id, versaoId),
          eq(atendimentoIaDocumentoVersoesTable.estado, "em_revisao"),
          sql`${atendimentoIaDocumentoVersoesTable.statusIndexacao} in ('pendente', 'falhou')`,
        ),
      )
      .returning();
    if (!versao) throw new Error("INDEXACAO_EM_ANDAMENTO_OU_ESTADO_INVALIDO");
    return versao;
  }

  async registrarFalhaIndexacao(versaoId: string) {
    await dbTransacional
      .update(atendimentoIaDocumentoVersoesTable)
      .set({ atualizadoEm: new Date(), statusIndexacao: "falhou" })
      .where(
        and(
          eq(atendimentoIaDocumentoVersoesTable.id, versaoId),
          eq(atendimentoIaDocumentoVersoesTable.statusIndexacao, "processando"),
        ),
      );
  }

  async publicarIndexacao(dados: {
    configuracao: ConfiguracaoRag;
    embeddings: number[][];
    fragmentos: FragmentoInstitucional[];
    hashIndexacao: string;
    responsavelRevisaoId: string;
    versaoId: string;
  }) {
    return dbTransacional.transaction(async (tx) => {
      const [versao] = await tx
        .select()
        .from(atendimentoIaDocumentoVersoesTable)
        .where(eq(atendimentoIaDocumentoVersoesTable.id, dados.versaoId))
        .limit(1);
      if (!versao || versao.estado !== "em_revisao") {
        throw new Error("VERSAO_NAO_REVISAVEL");
      }
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${versao.documentoId}))`,
      );
      const [idempotente] = await tx
        .select()
        .from(atendimentoIaDocumentoVersoesTable)
        .where(
          and(
            eq(
              atendimentoIaDocumentoVersoesTable.documentoId,
              versao.documentoId,
            ),
            eq(
              atendimentoIaDocumentoVersoesTable.hashIndexacao,
              dados.hashIndexacao,
            ),
            eq(atendimentoIaDocumentoVersoesTable.statusIndexacao, "concluida"),
          ),
        )
        .limit(1);
      if (idempotente) return { idempotente: true, versao: idempotente };

      const agora = new Date();
      await tx
        .delete(atendimentoIaFragmentosInstitucionaisTable)
        .where(
          eq(
            atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId,
            versao.id,
          ),
        );
      if (dados.fragmentos.length !== dados.embeddings.length) {
        throw new Error("QUANTIDADE_EMBEDDINGS_INCOMPATIVEL");
      }
      await tx.insert(atendimentoIaFragmentosInstitucionaisTable).values(
        dados.fragmentos.map((fragmento, indice) => ({
          ativo: false,
          conteudo: fragmento.conteudo,
          dimensaoEmbedding: dados.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
          embedding: dados.embeddings[indice]!,
          hashConteudo: fragmento.hashConteudo,
          indexadoEm: agora,
          modeloEmbedding: dados.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
          posicao: fragmento.posicao,
          quantidadeTokens: fragmento.quantidadeTokens,
          secao: fragmento.secao,
          versaoDocumentoId: versao.id,
        })),
      );
      const [atualizada] = await tx
        .update(atendimentoIaDocumentoVersoesTable)
        .set({
          atualizadoEm: agora,
          dimensaoEmbedding: dados.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
          estado: "publicado",
          hashIndexacao: dados.hashIndexacao,
          indexadoEm: agora,
          modeloEmbedding: dados.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
          publicadoEm: agora,
          responsavelRevisaoId: dados.responsavelRevisaoId,
          revisadoEm: agora,
          statusIndexacao: "concluida",
        })
        .where(eq(atendimentoIaDocumentoVersoesTable.id, versao.id))
        .returning();
      await tx
        .update(atendimentoIaFragmentosInstitucionaisTable)
        .set({ ativo: true, atualizadoEm: agora })
        .where(
          eq(
            atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId,
            versao.id,
          ),
        );
      const anteriores = await tx
        .update(atendimentoIaDocumentoVersoesTable)
        .set({ atualizadoEm: agora, desativadoEm: agora, estado: "desativado" })
        .where(
          and(
            eq(
              atendimentoIaDocumentoVersoesTable.documentoId,
              versao.documentoId,
            ),
            eq(atendimentoIaDocumentoVersoesTable.estado, "publicado"),
            sql`${atendimentoIaDocumentoVersoesTable.id} <> ${versao.id}`,
          ),
        )
        .returning({ id: atendimentoIaDocumentoVersoesTable.id });
      if (anteriores.length > 0) {
        await tx
          .update(atendimentoIaFragmentosInstitucionaisTable)
          .set({ ativo: false, atualizadoEm: agora })
          .where(
            sql`${atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId} in (${sql.join(
              anteriores.map((item) => sql`${item.id}`),
              sql`, `,
            )})`,
          );
      }
      if (!atualizada) throw new Error("PUBLICACAO_INSTITUCIONAL_FALHOU");
      return { idempotente: false, versao: atualizada };
    });
  }

  async desativar(versaoId: string) {
    return dbTransacional.transaction(async (tx) => {
      const agora = new Date();
      const [versao] = await tx
        .update(atendimentoIaDocumentoVersoesTable)
        .set({ atualizadoEm: agora, desativadoEm: agora, estado: "desativado" })
        .where(eq(atendimentoIaDocumentoVersoesTable.id, versaoId))
        .returning();
      if (!versao) throw new Error("VERSAO_INSTITUCIONAL_INDISPONIVEL");
      await tx
        .update(atendimentoIaFragmentosInstitucionaisTable)
        .set({ ativo: false, atualizadoEm: agora })
        .where(
          eq(
            atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId,
            versaoId,
          ),
        );
      return versao;
    });
  }

  async buscarCandidatos(dados: {
    dimensao: number;
    limite: number;
    modelo: string;
    pesoSemantico: number;
    pesoTextual: number;
    pergunta: string;
    vetor: number[];
  }): Promise<CandidatoRag[]> {
    if (dados.vetor.length !== dados.dimensao)
      throw new Error("DIMENSAO_EMBEDDING_INCOMPATIVEL");
    const vetor = vetorSql(dados.vetor);
    const filtroPublicacao =
      process.env.ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS === "true"
        ? sql`f.ativo=true and v.estado='publicado' and exists (select 1 from atendimento_ia_publicacao_itens pi join atendimento_ia_publicacoes p on p.id=pi.publicacao_id where pi.candidato_id=v.id and p.status='concluida')`
        : sql`((f.ativo=true and v.estado='publicado' and not exists (select 1 from atendimento_ia_publicacao_itens pi where pi.candidato_id=v.id)) or (not f.ativo and exists (select 1 from atendimento_ia_publicacao_itens pi join atendimento_ia_publicacoes p on p.id=pi.publicacao_id where pi.versao_anterior_id=v.id and p.status='concluida') and not exists (select 1 from atendimento_ia_publicacao_itens propria where propria.candidato_id=v.id)))`;
    const resultado = await dbTransacional.execute(sql`
      with pontuados as (
        select f.id as fragmento_id, d.id as documento_id, v.id as versao_id, v.versao, v.titulo,
               f.secao, f.conteudo, f.hash_conteudo,
               greatest(0, 1 - (f.embedding <=> ${vetor}::vector))::real as pontuacao_semantica,
               least(1, greatest(
                 ts_rank_cd(to_tsvector('portuguese', f.conteudo), websearch_to_tsquery('portuguese', ${dados.pergunta})),
                 case when lower(f.conteudo) like '%' || lower(${dados.pergunta}) || '%' then 1 else 0 end
               ))::real as pontuacao_textual
        from atendimento_ia_fragmentos_institucionais f
        join atendimento_ia_documento_versoes v on v.id=f.versao_documento_id
        join atendimento_ia_documentos_institucionais d on d.id=v.documento_id
        where ${filtroPublicacao} and v.status_indexacao='concluida'
          and f.modelo_embedding=${dados.modelo} and f.dimensao_embedding=${dados.dimensao}
      )
      select * from pontuados
      order by (pontuacao_semantica * ${dados.pesoSemantico} + pontuacao_textual * ${dados.pesoTextual}) desc,
               fragmento_id
      limit ${dados.limite}
    `);
    return (resultado.rows as Array<Record<string, unknown>>).map((linha) => ({
      conteudo: String(linha.conteudo),
      documentoId: String(linha.documento_id),
      fragmentoId: String(linha.fragmento_id),
      hashConteudo: String(linha.hash_conteudo),
      pontuacaoSemantica: Number(linha.pontuacao_semantica),
      pontuacaoTextual: Number(linha.pontuacao_textual),
      secao: linha.secao ? String(linha.secao) : null,
      titulo: String(linha.titulo),
      versao: Number(linha.versao),
      versaoId: String(linha.versao_id),
    }));
  }

  async registrarBusca(
    dados: ResultadoRecuperacaoRag & { hashPergunta: string },
  ) {
    return dbTransacional.transaction(async (tx) => {
      const [existente] = await tx
        .select()
        .from(atendimentoIaBuscasRagTable)
        .where(
          and(
            eq(atendimentoIaBuscasRagTable.execucaoId, dados.execucaoId),
            eq(atendimentoIaBuscasRagTable.hashPergunta, dados.hashPergunta),
          ),
        )
        .limit(1);
      if (existente) return existente;
      const [busca] = await tx
        .insert(atendimentoIaBuscasRagTable)
        .values({
          configuracao: dados.configuracao,
          conflito: dados.conflito,
          execucaoId: dados.execucaoId,
          hashPergunta: dados.hashPergunta,
          status: dados.status,
        })
        .returning();
      if (!busca) throw new Error("REGISTRO_BUSCA_RAG_FALHOU");
      if (dados.fontes.length > 0) {
        await tx.insert(atendimentoIaResultadosRagTable).values(
          dados.fontes.map((fonte, posicao) => ({
            buscaId: busca.id,
            fragmentoId: fonte.fragmentoId,
            pontuacaoFinal: fonte.pontuacaoFinal,
            pontuacaoSemantica: fonte.pontuacaoSemantica,
            pontuacaoTextual: fonte.pontuacaoTextual,
            posicao,
          })),
        );
        const versoesIds = [
          ...new Set(
            dados.fontes.flatMap((fonte) =>
              fonte.versaoId ? [fonte.versaoId] : [],
            ),
          ),
        ];
        const publicacoes = versoesIds.length
          ? await tx
              .select({ identidade: atendimentoIaPublicacoesTable.identidade })
              .from(atendimentoIaPublicacaoItensTable)
              .innerJoin(
                atendimentoIaPublicacoesTable,
                eq(
                  atendimentoIaPublicacoesTable.id,
                  atendimentoIaPublicacaoItensTable.publicacaoId,
                ),
              )
              .where(
                sql`${atendimentoIaPublicacaoItensTable.candidatoId} in (${sql.join(
                  versoesIds.map((id) => sql`${id}`),
                  sql`, `,
                )}) and ${atendimentoIaPublicacoesTable.status}='concluida'`,
              )
          : [];
        const [execucao] = await tx
          .select({
            hash: atendimentoIaExecucoesTable.hashConfiguracaoEfetiva,
            identidade: atendimentoIaExecucoesTable.identidadePublicacao,
          })
          .from(atendimentoIaExecucoesTable)
          .where(eq(atendimentoIaExecucoesTable.id, dados.execucaoId))
          .limit(1);
        const identidades = [
          ...(execucao?.identidade ? [execucao.identidade] : []),
          ...publicacoes.map((item) => item.identidade),
        ].filter((item, indice, todos) => todos.indexOf(item) === indice);
        const hashEfetivo = createHash("sha256")
          .update(
            JSON.stringify({
              comportamento: execucao?.hash ?? null,
              conhecimentos: [...versoesIds].sort(),
            }),
          )
          .digest("hex");
        await tx
          .update(atendimentoIaExecucoesTable)
          .set({
            conhecimentoVersoesIds: versoesIds,
            identidadePublicacao: identidades.join(";") || null,
            hashConfiguracaoEfetiva: hashEfetivo,
          })
          .where(eq(atendimentoIaExecucoesTable.id, dados.execucaoId));
      }
      return busca;
    });
  }
}

export function calcularHashIndexacao(dados: {
  dimensao: number;
  hashConteudo: string;
  limite: number;
  modelo: string;
  sobreposicao: number;
}) {
  return createHash("sha256").update(JSON.stringify(dados)).digest("hex");
}
