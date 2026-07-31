import "server-only";

import { and, eq } from "drizzle-orm";

import {
  atendimentoIaAuditoriasTable,
  atendimentoIaExecucoesFerramentasTable,
  atendimentoIaExecucoesTable,
  atendimentoIaMensagensTable,
  atendimentoIaOcorrenciasTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { validarTransicaoFerramentaPublica } from "../lib/ferramentas-publicas/transicoes-ferramentas-publicas";
import type {
  RepositorioExecucoesFerramentas,
  ResultadoFerramentaPublica,
} from "../types/ferramentas-publicas";

export class RepositorioFerramentasPublicasDrizzle
  implements RepositorioExecucoesFerramentas
{
  async reivindicar(
    dados: Parameters<RepositorioExecucoesFerramentas["reivindicar"]>[0],
  ): ReturnType<RepositorioExecucoesFerramentas["reivindicar"]> {
    return dbTransacional.transaction(async (transacao) => {
      const [vinculo] = await transacao
        .select({
          conversaId: atendimentoIaExecucoesTable.conversaId,
          mensagemId: atendimentoIaExecucoesTable.mensagemId,
          mensagemStatus: atendimentoIaMensagensTable.status,
        })
        .from(atendimentoIaExecucoesTable)
        .innerJoin(
          atendimentoIaMensagensTable,
          eq(
            atendimentoIaMensagensTable.id,
            atendimentoIaExecucoesTable.mensagemId,
          ),
        )
        .where(
          and(
            eq(atendimentoIaExecucoesTable.id, dados.execucaoId),
            eq(atendimentoIaExecucoesTable.status, "processando"),
          ),
        )
        .limit(1);
      if (
        !vinculo?.mensagemId ||
        !["processando", "executando_ferramenta"].includes(
          vinculo.mensagemStatus,
        )
      ) {
        throw new Error("VINCULO_FERRAMENTA_INVALIDO");
      }

      const [criada] = await transacao
        .insert(atendimentoIaExecucoesFerramentasTable)
        .values({
          argumentos: dados.argumentos,
          chaveIdempotencia: dados.chaveIdempotencia,
          classificacao: "consulta_publica",
          execucaoId: dados.execucaoId,
          nomeFerramenta: dados.nome,
          versaoFerramenta: dados.versao,
        })
        .onConflictDoNothing()
        .returning({ id: atendimentoIaExecucoesFerramentasTable.id });

      if (!criada) {
        const [existente] = await transacao
          .select({
            resultado: atendimentoIaExecucoesFerramentasTable.resultado,
            status: atendimentoIaExecucoesFerramentasTable.status,
          })
          .from(atendimentoIaExecucoesFerramentasTable)
          .where(
            eq(
              atendimentoIaExecucoesFerramentasTable.chaveIdempotencia,
              dados.chaveIdempotencia,
            ),
          )
          .limit(1);
        if (existente?.status === "concluida" && existente.resultado) {
          return {
            resultado: existente.resultado as ResultadoFerramentaPublica,
            tipo: "concluida" as const,
          };
        }
        return { tipo: "em_processamento" as const };
      }

      validarTransicaoFerramentaPublica("processando", "aguardando_ferramenta");
      validarTransicaoFerramentaPublica(
        "aguardando_ferramenta",
        "executando_ferramenta",
      );
      const [aguardando] = await transacao
        .update(atendimentoIaMensagensTable)
        .set({ atualizadoEm: new Date(), status: "aguardando_ferramenta" })
        .where(
          and(
            eq(atendimentoIaMensagensTable.id, vinculo.mensagemId),
            eq(atendimentoIaMensagensTable.status, "processando"),
          ),
        )
        .returning({ id: atendimentoIaMensagensTable.id });
      if (!aguardando) throw new Error("TRANSICAO_FERRAMENTA_CONCORRENTE");
      const [executando] = await transacao
        .update(atendimentoIaMensagensTable)
        .set({ atualizadoEm: new Date(), status: "executando_ferramenta" })
        .where(
          and(
            eq(atendimentoIaMensagensTable.id, vinculo.mensagemId),
            eq(atendimentoIaMensagensTable.status, "aguardando_ferramenta"),
          ),
        )
        .returning({ id: atendimentoIaMensagensTable.id });
      if (!executando) throw new Error("TRANSICAO_FERRAMENTA_CONCORRENTE");
      await transacao.insert(atendimentoIaAuditoriasTable).values({
        conversaId: vinculo.conversaId,
        evento: "ferramenta_publica_iniciada",
        execucaoFerramentaId: criada.id,
        execucaoId: dados.execucaoId,
        mensagemId: vinculo.mensagemId,
        metadados: {
          chamadaId: dados.chamadaId,
          classificacao: "consulta_publica",
          nome: dados.nome,
          versao: dados.versao,
        },
        tipoAtor: "sistema",
      });

      return { execucaoFerramentaId: criada.id, tipo: "adquirida" as const };
    });
  }

  async concluir(
    dados: Parameters<RepositorioExecucoesFerramentas["concluir"]>[0],
  ) {
    await dbTransacional.transaction(async (transacao) => {
      const [vinculo] = await transacao
        .select({
          conversaId: atendimentoIaExecucoesTable.conversaId,
          execucaoId: atendimentoIaExecucoesTable.id,
          mensagemId: atendimentoIaExecucoesTable.mensagemId,
          nome: atendimentoIaExecucoesFerramentasTable.nomeFerramenta,
        })
        .from(atendimentoIaExecucoesFerramentasTable)
        .innerJoin(
          atendimentoIaExecucoesTable,
          and(
            eq(
              atendimentoIaExecucoesTable.id,
              atendimentoIaExecucoesFerramentasTable.execucaoId,
            ),
            eq(atendimentoIaExecucoesTable.status, "processando"),
          ),
        )
        .where(
          and(
            eq(
              atendimentoIaExecucoesFerramentasTable.id,
              dados.execucaoFerramentaId,
            ),
            eq(atendimentoIaExecucoesFerramentasTable.status, "processando"),
          ),
        )
        .limit(1);
      if (!vinculo?.mensagemId) throw new Error("VINCULO_FERRAMENTA_INVALIDO");

      const agora = new Date();
      validarTransicaoFerramentaPublica("executando_ferramenta", "processando");
      await transacao
        .update(atendimentoIaExecucoesFerramentasTable)
        .set({
          atualizadoEm: agora,
          concluidoEm: agora,
          duracaoEmMs: dados.duracaoEmMs,
          resultado: dados.resultado,
          status: "concluida",
        })
        .where(
          eq(
            atendimentoIaExecucoesFerramentasTable.id,
            dados.execucaoFerramentaId,
          ),
        );
      const [mensagemAtualizada] = await transacao
        .update(atendimentoIaMensagensTable)
        .set({ atualizadoEm: agora, status: "processando" })
        .where(
          and(
            eq(atendimentoIaMensagensTable.id, vinculo.mensagemId),
            eq(atendimentoIaMensagensTable.status, "executando_ferramenta"),
          ),
        )
        .returning({ id: atendimentoIaMensagensTable.id });
      if (!mensagemAtualizada) {
        throw new Error("TRANSICAO_FERRAMENTA_CONCORRENTE");
      }
      await transacao.insert(atendimentoIaAuditoriasTable).values({
        conversaId: vinculo.conversaId,
        evento: "ferramenta_publica_concluida",
        execucaoFerramentaId: dados.execucaoFerramentaId,
        execucaoId: vinculo.execucaoId,
        mensagemId: vinculo.mensagemId,
        metadados: {
          fonte: dados.resultado.fonte,
          nome: vinculo.nome,
          statusResultado: dados.resultado.status,
        },
        tipoAtor: "sistema",
      });
    });
  }

  async falhar(
    dados: Parameters<RepositorioExecucoesFerramentas["falhar"]>[0],
  ) {
    await dbTransacional.transaction(async (transacao) => {
      const [vinculo] = await transacao
        .select({
          conversaId: atendimentoIaExecucoesTable.conversaId,
          execucaoId: atendimentoIaExecucoesTable.id,
          mensagemId: atendimentoIaExecucoesTable.mensagemId,
        })
        .from(atendimentoIaExecucoesFerramentasTable)
        .innerJoin(
          atendimentoIaExecucoesTable,
          eq(
            atendimentoIaExecucoesTable.id,
            atendimentoIaExecucoesFerramentasTable.execucaoId,
          ),
        )
        .where(
          eq(
            atendimentoIaExecucoesFerramentasTable.id,
            dados.execucaoFerramentaId,
          ),
        )
        .limit(1);
      if (!vinculo?.mensagemId) throw new Error("VINCULO_FERRAMENTA_INVALIDO");

      const agora = new Date();
      validarTransicaoFerramentaPublica("executando_ferramenta", "processando");
      await transacao
        .update(atendimentoIaExecucoesFerramentasTable)
        .set({
          atualizadoEm: agora,
          concluidoEm: agora,
          erro: `${dados.classificacao}:${dados.tipo}`,
          status: "falhou",
        })
        .where(
          eq(
            atendimentoIaExecucoesFerramentasTable.id,
            dados.execucaoFerramentaId,
          ),
        );
      const [mensagemAtualizada] = await transacao
        .update(atendimentoIaMensagensTable)
        .set({ atualizadoEm: agora, status: "processando" })
        .where(
          and(
            eq(atendimentoIaMensagensTable.id, vinculo.mensagemId),
            eq(atendimentoIaMensagensTable.status, "executando_ferramenta"),
          ),
        )
        .returning({ id: atendimentoIaMensagensTable.id });
      if (!mensagemAtualizada) {
        throw new Error("TRANSICAO_FERRAMENTA_CONCORRENTE");
      }
      await transacao.insert(atendimentoIaOcorrenciasTable).values({
        conversaId: vinculo.conversaId,
        descricaoSanitizada: "Falha segura em ferramenta pública de consulta.",
        execucaoId: vinculo.execucaoId,
        mensagemId: vinculo.mensagemId,
        recuperacaoTentada: false,
        tipo: dados.tipo,
      });
    });
  }
}
