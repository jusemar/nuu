"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import {
  atendimentoIaAuditoriasTable,
  atendimentoIaComportamentosTable,
  atendimentoIaComportamentoVersoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { calcularHashComportamento } from "../../lib/admin/comportamento/calcular-hash-comportamento";
import { montarInstrucoesCandidatas } from "../../lib/admin/comportamento/montar-instrucoes-candidatas";
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
import { restaurarVersaoComportamentoSchema } from "../../schemas/admin/restauracao.schema";

export async function restaurarVersaoComportamento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("restauracoes_escrita");
  const dados = restaurarVersaoComportamentoSchema.parse(entrada);
  const justificativa = normalizarJustificativaRestauracao(dados.justificativa);
  const justificativaAuditoria = mascararDadosPessoaisAdmin(justificativa, 300);
  const identidade = calcularIdentidadeRestauracao({
    atorId: ator.usuarioId,
    chaveIdempotencia: dados.chaveIdempotencia,
    justificativaNormalizada: justificativa,
    recursoId: dados.recursoId,
    tipo: "comportamento",
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
              "atendimento_ia_restauracao_comportamento_concluida",
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
            id: atendimentoIaComportamentoVersoesTable.id,
            numero: atendimentoIaComportamentoVersoesTable.numeroVersao,
          })
          .from(atendimentoIaComportamentoVersoesTable)
          .where(eq(atendimentoIaComportamentoVersoesTable.id, idRepetido))
          .limit(1);
        if (!repetida) throw new Error("VERSAO_HISTORICA_NAO_ENCONTRADA");
        return { id: repetida.id, repetida: true, versao: repetida.numero };
      }

      const [origem] = await tx
        .select({
          comportamentoId:
            atendimentoIaComportamentoVersoesTable.comportamentoId,
          configuracao:
            atendimentoIaComportamentoVersoesTable.configuracaoEstruturada,
          hash: atendimentoIaComportamentoVersoesTable.hash,
          id: atendimentoIaComportamentoVersoesTable.id,
          numero: atendimentoIaComportamentoVersoesTable.numeroVersao,
        })
        .from(atendimentoIaComportamentoVersoesTable)
        .where(eq(atendimentoIaComportamentoVersoesTable.id, dados.versaoOrigemId))
        .limit(1);
      if (!origem) throw new Error("VERSAO_HISTORICA_NAO_ENCONTRADA");
      validarOrigemRestauracao({
        recursoEsperadoId: dados.recursoId,
        recursoOrigemId: origem.comportamentoId,
        versaoOrigemId: origem.id,
      });
      const [comportamento] = await tx
        .select({ id: atendimentoIaComportamentosTable.id })
        .from(atendimentoIaComportamentosTable)
        .where(eq(atendimentoIaComportamentosTable.id, dados.recursoId))
        .limit(1);
      if (!comportamento) throw new Error("VERSAO_HISTORICA_NAO_ENCONTRADA");
      const [ultima] = await tx
        .select({
          id: atendimentoIaComportamentoVersoesTable.id,
          numero: atendimentoIaComportamentoVersoesTable.numeroVersao,
        })
        .from(atendimentoIaComportamentoVersoesTable)
        .where(
          eq(
            atendimentoIaComportamentoVersoesTable.comportamentoId,
            dados.recursoId,
          ),
        )
        .orderBy(desc(atendimentoIaComportamentoVersoesTable.numeroVersao))
        .limit(1);
      if (!ultima || ultima.numero !== dados.versaoAtualEsperada)
        throw new Error("CONFLITO_VERSAO_RESTAURACAO");

      let validada: ReturnType<typeof montarInstrucoesCandidatas>;
      try {
        validada = montarInstrucoesCandidatas(origem.configuracao);
      } catch {
        throw new Error("COMPORTAMENTO_HISTORICO_INCOMPATIVEL");
      }
      const hash = calcularHashComportamento(validada.configuracao);
      const candidato = criarCandidatoRestauracao({
        conteudo: validada,
        hash,
        justificativa,
        proximoNumero: ultima.numero + 1,
        versaoAnteriorId: ultima.id,
        versaoOrigemId: origem.id,
      });

      await registrarAuditoriaPermissaoAtendimentoIa(tx, {
        acao: "restaurar_versao_comportamento",
        atorId: ator.usuarioId,
        evento: "atendimento_ia_restauracao_comportamento_solicitada",
        metadados: {
          comportamentoId: dados.recursoId,
          versaoOrigemId: origem.id,
        },
        resultado: "sucesso_comprovado",
      });
      const [nova] = await tx
        .insert(atendimentoIaComportamentoVersoesTable)
        .values({
          blocosAdministrativos: candidato.conteudo.blocos,
          comportamentoId: dados.recursoId,
          configuracaoEstruturada: candidato.conteudo.configuracao,
          criadoPorId: ator.usuarioId,
          estado: candidato.estado,
          hash: candidato.hash,
          motivoAlteracao: candidato.motivoAlteracao,
          numeroVersao: candidato.proximoNumero,
          restauradaDeVersaoId: candidato.restauradaDeVersaoId,
          resumoAlteracao: candidato.resumoAlteracao,
        })
        .returning({
          id: atendimentoIaComportamentoVersoesTable.id,
          numero: atendimentoIaComportamentoVersoesTable.numeroVersao,
        });
      if (!nova) throw new Error("FALHA_RESTAURACAO_SANITIZADA");
      await registrarAuditoriaPermissaoAtendimentoIa(tx, {
        acao: "restaurar_versao_comportamento",
        atorId: ator.usuarioId,
        evento: "atendimento_ia_restauracao_comportamento_concluida",
        metadados: {
          chaveIdempotencia: dados.chaveIdempotencia,
          comportamentoId: dados.recursoId,
          hashNovo: hash,
          hashOrigem: origem.hash,
          identidade,
          justificativa: justificativaAuditoria,
          novaVersaoId: nova.id,
          numeroNovaVersao: nova.numero,
          versaoNucleoProtegidoAtual: validada.versaoNucleo,
          versaoOrigemId: origem.id,
        },
        resultado: "sucesso_comprovado",
      });
      return { id: nova.id, repetida: false, versao: nova.numero };
    });
    revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
    return { ...resultado, estado: "rascunho" as const, sucesso: true as const };
  } catch (erro) {
    await db
      .insert(atendimentoIaAuditoriasTable)
      .values({
        acao: "restaurar_versao_comportamento",
        autorizacao: "negada",
        categoria: "seguranca",
        evento: "atendimento_ia_restauracao_comportamento_rejeitada",
        identificadorAtor: ator.usuarioId,
        metadados: {
          codigo: codigoFalhaRestauracaoSeguro(erro),
          comportamentoId: dados.recursoId,
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
