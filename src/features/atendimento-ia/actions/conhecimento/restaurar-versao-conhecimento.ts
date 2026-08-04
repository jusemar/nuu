"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import {
  atendimentoIaAuditoriasTable,
  atendimentoIaDocumentosInstitucionaisTable,
  atendimentoIaDocumentoVersoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { prepararVersaoConhecimento } from "../../lib/admin/conhecimento/preparar-versao-conhecimento";
import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { calcularIdentidadeRestauracao } from "../../lib/admin/restauracao/calcular-identidade-restauracao";
import { criarCandidatoRestauracao } from "../../lib/admin/restauracao/criar-candidato-restauracao";
import {
  codigoFalhaRestauracaoSeguro,
  normalizarJustificativaRestauracao,
} from "../../lib/admin/restauracao/politica-restauracao";
import { validarIdempotenciaRestauracao } from "../../lib/admin/restauracao/validar-idempotencia-restauracao";
import { validarOrigemRestauracao } from "../../lib/admin/restauracao/validar-origem-restauracao";
import { mascararDadosPessoaisAdmin } from "../../lib/admin/sanitizacao/mascarar-dados-pessoais-admin";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { criarVersaoConhecimentoSchema } from "../../schemas/admin/editor-conhecimento.schema";
import { restaurarVersaoConhecimentoSchema } from "../../schemas/admin/restauracao.schema";

export async function restaurarVersaoConhecimento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("restauracoes_escrita");
  const dados = restaurarVersaoConhecimentoSchema.parse(entrada);
  const justificativa = normalizarJustificativaRestauracao(dados.justificativa);
  const justificativaAuditoria = mascararDadosPessoaisAdmin(justificativa, 300);
  const identidade = calcularIdentidadeRestauracao({
    atorId: ator.usuarioId,
    chaveIdempotencia: dados.chaveIdempotencia,
    justificativaNormalizada: justificativa,
    recursoId: dados.recursoId,
    tipo: "conhecimento",
    versaoOrigemId: dados.versaoOrigemId,
  });

  try {
    const resultado = await dbTransacional.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${dados.chaveIdempotencia}))`,
      );
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${dados.recursoId}))`,
      );

      const [auditoriaExistente] = await tx
        .select({ metadados: atendimentoIaAuditoriasTable.metadados })
        .from(atendimentoIaAuditoriasTable)
        .where(
          and(
            eq(
              atendimentoIaAuditoriasTable.evento,
              "atendimento_ia_restauracao_conhecimento_concluida",
            ),
            sql`${atendimentoIaAuditoriasTable.metadados}->>'chaveIdempotencia' = ${dados.chaveIdempotencia}`,
          ),
        )
        .limit(1);
      const metadadosExistentes = auditoriaExistente?.metadados;
      const idRepetido = validarIdempotenciaRestauracao(
        metadadosExistentes &&
          typeof metadadosExistentes.identidade === "string" &&
          typeof metadadosExistentes.novaVersaoId === "string"
          ? {
              identidade: metadadosExistentes.identidade,
              novaVersaoId: metadadosExistentes.novaVersaoId,
            }
          : null,
        identidade,
      );
      if (idRepetido) {
        const [repetida] = await tx
          .select({
            id: atendimentoIaDocumentoVersoesTable.id,
            versao: atendimentoIaDocumentoVersoesTable.versao,
          })
          .from(atendimentoIaDocumentoVersoesTable)
          .where(eq(atendimentoIaDocumentoVersoesTable.id, idRepetido))
          .limit(1);
        if (!repetida) throw new Error("VERSAO_HISTORICA_NAO_ENCONTRADA");
        return { id: repetida.id, repetida: true, versao: repetida.versao };
      }

      const [origem] = await tx
        .select({
          conteudoEstruturado:
            atendimentoIaDocumentoVersoesTable.conteudoEstruturado,
          documentoId: atendimentoIaDocumentoVersoesTable.documentoId,
          hash: atendimentoIaDocumentoVersoesTable.hashConteudo,
          id: atendimentoIaDocumentoVersoesTable.id,
          versao: atendimentoIaDocumentoVersoesTable.versao,
        })
        .from(atendimentoIaDocumentoVersoesTable)
        .where(eq(atendimentoIaDocumentoVersoesTable.id, dados.versaoOrigemId))
        .limit(1);
      if (!origem) throw new Error("VERSAO_HISTORICA_NAO_ENCONTRADA");
      validarOrigemRestauracao({
        recursoEsperadoId: dados.recursoId,
        recursoOrigemId: origem.documentoId,
        versaoOrigemId: origem.id,
      });
      if (!origem.conteudoEstruturado)
        throw new Error("VERSAO_HISTORICA_NAO_ENCONTRADA");

      const [documento] = await tx
        .select({
          categoria: atendimentoIaDocumentosInstitucionaisTable.categoria,
          origem: atendimentoIaDocumentosInstitucionaisTable.origem,
          tipo: atendimentoIaDocumentosInstitucionaisTable.tipoConhecimento,
          titulo: atendimentoIaDocumentosInstitucionaisTable.tituloAdministrativo,
        })
        .from(atendimentoIaDocumentosInstitucionaisTable)
        .where(eq(atendimentoIaDocumentosInstitucionaisTable.id, dados.recursoId))
        .limit(1);
      if (!documento) throw new Error("VERSAO_HISTORICA_NAO_ENCONTRADA");

      const [ultima] = await tx
        .select({
          id: atendimentoIaDocumentoVersoesTable.id,
          versao: atendimentoIaDocumentoVersoesTable.versao,
        })
        .from(atendimentoIaDocumentoVersoesTable)
        .where(eq(atendimentoIaDocumentoVersoesTable.documentoId, dados.recursoId))
        .orderBy(desc(atendimentoIaDocumentoVersoesTable.versao))
        .limit(1);
      if (!ultima || ultima.versao !== dados.versaoAtualEsperada)
        throw new Error("CONFLITO_VERSAO_RESTAURACAO");

      const conteudoValidado = criarVersaoConhecimentoSchema.parse({
        conhecimentoId: dados.recursoId,
        conteudo: origem.conteudoEstruturado,
        motivoAlteracao: justificativa,
        resumoAlteracao: `Restauração da versão ${origem.versao}`,
      });
      const canonico = prepararVersaoConhecimento(
        documento.tipo,
        conteudoValidado,
        {
          categoria: documento.categoria,
          origem: documento.origem,
          tituloAdministrativo: documento.titulo ?? "Conhecimento",
        },
      );
      const candidato = criarCandidatoRestauracao({
        conteudo: conteudoValidado.conteudo,
        hash: canonico.hash,
        justificativa,
        proximoNumero: ultima.versao + 1,
        versaoAnteriorId: ultima.id,
        versaoOrigemId: origem.id,
      });

      await registrarAuditoriaPermissaoAtendimentoIa(tx, {
        acao: "restaurar_versao_conhecimento",
        atorId: ator.usuarioId,
        evento: "atendimento_ia_restauracao_conhecimento_solicitada",
        metadados: {
          recursoId: dados.recursoId,
          tipoConhecimento: documento.tipo,
          versaoOrigemId: origem.id,
        },
        resultado: "sucesso_comprovado",
      });
      const [nova] = await tx
        .insert(atendimentoIaDocumentoVersoesTable)
        .values({
          conteudo: canonico.conteudo,
          conteudoEstruturado: candidato.conteudo,
          criadoPorId: ator.usuarioId,
          documentoId: dados.recursoId,
          estado: candidato.estado,
          hashConteudo: candidato.hash,
          motivoAlteracao: candidato.motivoAlteracao,
          restauradaDeVersaoId: candidato.restauradaDeVersaoId,
          resumoAlteracao: candidato.resumoAlteracao,
          statusIndexacao: "pendente",
          titulo: documento.titulo ?? "Conhecimento",
          versao: candidato.proximoNumero,
          versaoAnteriorId: candidato.versaoAnteriorId,
        })
        .returning({
          id: atendimentoIaDocumentoVersoesTable.id,
          versao: atendimentoIaDocumentoVersoesTable.versao,
        });
      if (!nova) throw new Error("FALHA_RESTAURACAO_SANITIZADA");
      await registrarAuditoriaPermissaoAtendimentoIa(tx, {
        acao: "restaurar_versao_conhecimento",
        atorId: ator.usuarioId,
        evento: "atendimento_ia_restauracao_conhecimento_concluida",
        metadados: {
          chaveIdempotencia: dados.chaveIdempotencia,
          hashNovo: canonico.hash,
          hashOrigem: origem.hash,
          identidade,
          justificativa: justificativaAuditoria,
          novaVersaoId: nova.id,
          numeroNovaVersao: nova.versao,
          recursoId: dados.recursoId,
          tipoConhecimento: documento.tipo,
          versaoOrigemId: origem.id,
        },
        resultado: "sucesso_comprovado",
      });
      return { id: nova.id, repetida: false, versao: nova.versao };
    });
    revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
    return { ...resultado, estado: "rascunho" as const, sucesso: true as const };
  } catch (erro) {
    await db
      .insert(atendimentoIaAuditoriasTable)
      .values({
        acao: "restaurar_versao_conhecimento",
        autorizacao: "negada",
        categoria: "seguranca",
        evento: "atendimento_ia_restauracao_conhecimento_rejeitada",
        identificadorAtor: ator.usuarioId,
        metadados: {
          codigo: codigoFalhaRestauracaoSeguro(erro),
          recursoId: dados.recursoId,
          versaoOrigemId: dados.versaoOrigemId,
        },
        resultado: "recusa",
        severidade: "atencao",
        tipoAtor: "usuario_admin",
        usuarioId: ator.usuarioId,
        versoes: { restauracaoAtendimentoIa: "v1" },
      })
      .catch(() => undefined);
    throw erro;
  }
}
