import "server-only";

import { and, desc, eq, gt, isNull, lt, or } from "drizzle-orm";

import {
  atendimentoIaAuditoriasTable,
  atendimentoIaConversasTable,
  atendimentoIaEstadosTable,
  atendimentoIaExecucoesTable,
  atendimentoIaIdempotenciasTable,
  atendimentoIaMemoriasTable,
  atendimentoIaMensagensTable,
  atendimentoIaOcorrenciasTable,
  atendimentoIaResumosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import {
  DURACAO_REIVINDICACAO_ORQUESTRADOR_EM_MS,
  ESCOPO_IDEMPOTENCIA_ORQUESTRADOR,
  LIMITE_MENSAGENS_CONTEXTO_ORQUESTRADOR,
  MODELO_EXECUCAO_NAO_INICIADA,
} from "../constants/orquestrador";
import { conversaPertenceAIdentidade } from "../lib/seguranca-entrada-mensagem";
import { validarTransicaoOrquestrador } from "../lib/transicoes-orquestrador";
import type {
  ContextoPersistidoOrquestrador,
  ReivindicacaoOrquestracao,
  RepositorioOrquestrador,
  ResultadoComponenteOrquestrado,
} from "../types/orquestrador";

export class ErroOrquestrador extends Error {
  constructor(
    public readonly codigo:
      | "CONVERSA_INDISPONIVEL"
      | "CONTEXTO_INCONSISTENTE"
      | "PERSISTENCIA_INDISPONIVEL",
  ) {
    super(codigo);
  }
}

export class RepositorioOrquestradorDrizzle implements RepositorioOrquestrador {
  async reivindicarProcessamento(dados: {
    identidade: {
      identificadorSessao: string;
      usuarioId: string | null;
    };
    memoriaAtiva: boolean;
    mensagemId: string;
  }): Promise<ReivindicacaoOrquestracao> {
    try {
      return await dbTransacional.transaction(async (transacao) => {
        const [registro] = await transacao
          .select({
            conversa: {
              canal: atendimentoIaConversasTable.canal,
              id: atendimentoIaConversasTable.id,
              identificadorSessao:
                atendimentoIaConversasTable.identificadorSessao,
              status: atendimentoIaConversasTable.status,
              usuarioId: atendimentoIaConversasTable.usuarioId,
            },
            mensagem: {
              autor: atendimentoIaMensagensTable.autor,
              conteudo: atendimentoIaMensagensTable.conteudo,
              conversaId: atendimentoIaMensagensTable.conversaId,
              criadoEm: atendimentoIaMensagensTable.criadoEm,
              id: atendimentoIaMensagensTable.id,
              status: atendimentoIaMensagensTable.status,
            },
          })
          .from(atendimentoIaMensagensTable)
          .innerJoin(
            atendimentoIaConversasTable,
            eq(
              atendimentoIaConversasTable.id,
              atendimentoIaMensagensTable.conversaId,
            ),
          )
          .where(eq(atendimentoIaMensagensTable.id, dados.mensagemId))
          .limit(1);

        if (
          !registro ||
          !conversaPertenceAIdentidade(registro.conversa, dados.identidade)
        ) {
          throw new ErroOrquestrador("CONVERSA_INDISPONIVEL");
        }

        const execucaoExistente = await this.buscarExecucaoDaReivindicacao(
          transacao,
          dados.mensagemId,
        );

        if (registro.mensagem.status === "concluida") {
          return {
            estado: registro.mensagem.status,
            execucaoId: execucaoExistente?.id ?? null,
            tipo: "ja_concluida",
          };
        }

        if (
          [
            "aguardando_ferramenta",
            "executando_ferramenta",
            "gerando_resposta",
            "aguardando_atendimento_humano",
          ].includes(registro.mensagem.status)
        ) {
          return {
            estado: registro.mensagem.status,
            execucaoId: execucaoExistente?.id ?? null,
            tipo: "em_processamento",
          };
        }

        if (registro.mensagem.status !== "processando") {
          return {
            estado: registro.mensagem.status,
            tipo: "estado_incompativel",
          };
        }

        const reivindicacao = await this.adquirirReivindicacao(
          transacao,
          dados.mensagemId,
        );
        if (!reivindicacao) {
          return {
            estado: registro.mensagem.status,
            execucaoId: execucaoExistente?.id ?? null,
            tipo: "em_processamento",
          };
        }

        if (execucaoExistente?.status === "processando") {
          const agora = new Date();
          await transacao
            .update(atendimentoIaExecucoesTable)
            .set({
              atualizadoEm: agora,
              concluidoEm: agora,
              erro: "recuperavel:erro_interno",
              status: "falhou",
            })
            .where(eq(atendimentoIaExecucoesTable.id, execucaoExistente.id));
          await transacao.insert(atendimentoIaOcorrenciasTable).values({
            conversaId: registro.conversa.id,
            descricaoSanitizada:
              "Execução interrompida foi liberada para nova tentativa segura.",
            execucaoId: execucaoExistente.id,
            mensagemId: registro.mensagem.id,
            recuperacaoConcluida: true,
            recuperacaoTentada: true,
            tipo: "erro_interno",
          });
        }

        const [execucao] = await transacao
          .insert(atendimentoIaExecucoesTable)
          .values({
            conversaId: registro.conversa.id,
            mensagemId: registro.mensagem.id,
            modelo: MODELO_EXECUCAO_NAO_INICIADA,
            status: "processando",
          })
          .returning({ id: atendimentoIaExecucoesTable.id });

        if (!execucao) {
          throw new ErroOrquestrador("PERSISTENCIA_INDISPONIVEL");
        }

        await transacao
          .update(atendimentoIaIdempotenciasTable)
          .set({
            atualizadoEm: new Date(),
            conversaId: registro.conversa.id,
            referenciaResultado: execucao.id,
          })
          .where(
            and(
              eq(
                atendimentoIaIdempotenciasTable.escopo,
                ESCOPO_IDEMPOTENCIA_ORQUESTRADOR,
              ),
              eq(atendimentoIaIdempotenciasTable.chave, dados.mensagemId),
            ),
          );

        const contexto = await this.carregarContexto(
          transacao,
          registro,
          dados.memoriaAtiva,
        );

        await transacao.insert(atendimentoIaAuditoriasTable).values([
          {
            conversaId: registro.conversa.id,
            evento: "orquestracao_iniciada",
            execucaoId: execucao.id,
            mensagemId: registro.mensagem.id,
            metadados: { canal: registro.conversa.canal },
            tipoAtor: "sistema",
          },
          {
            conversaId: registro.conversa.id,
            evento: "contexto_recuperado",
            execucaoId: execucao.id,
            mensagemId: registro.mensagem.id,
            metadados: {
              memoriaIncluida: contexto.memoriaPermitida.length > 0,
              mensagensAnteriores: contexto.mensagensAnteriores.length,
              resumoIncluido: contexto.resumo !== null,
            },
            tipoAtor: "sistema",
          },
        ]);

        return {
          contexto,
          execucaoId: execucao.id,
          tipo: "adquirida",
        };
      });
    } catch (erro) {
      if (erro instanceof ErroOrquestrador) throw erro;
      throw new ErroOrquestrador("PERSISTENCIA_INDISPONIVEL");
    }
  }

  async concluirEncaminhamento(dados: {
    execucaoId: string;
    mensagemId: string;
    proximoEstado:
      | "aguardando_ferramenta"
      | "gerando_resposta"
      | "aguardando_atendimento_humano";
    resultado: ResultadoComponenteOrquestrado;
  }) {
    validarTransicaoOrquestrador("processando", dados.proximoEstado);

    try {
      return await dbTransacional.transaction(async (transacao) => {
        const [vinculo] = await transacao
          .select({
            conversaId: atendimentoIaMensagensTable.conversaId,
            status: atendimentoIaMensagensTable.status,
          })
          .from(atendimentoIaMensagensTable)
          .innerJoin(
            atendimentoIaExecucoesTable,
            and(
              eq(atendimentoIaExecucoesTable.id, dados.execucaoId),
              eq(
                atendimentoIaExecucoesTable.mensagemId,
                atendimentoIaMensagensTable.id,
              ),
              eq(atendimentoIaExecucoesTable.status, "processando"),
            ),
          )
          .innerJoin(
            atendimentoIaIdempotenciasTable,
            and(
              eq(
                atendimentoIaIdempotenciasTable.escopo,
                ESCOPO_IDEMPOTENCIA_ORQUESTRADOR,
              ),
              eq(atendimentoIaIdempotenciasTable.chave, dados.mensagemId),
              eq(
                atendimentoIaIdempotenciasTable.referenciaResultado,
                dados.execucaoId,
              ),
              eq(atendimentoIaIdempotenciasTable.status, "processando"),
            ),
          )
          .where(eq(atendimentoIaMensagensTable.id, dados.mensagemId))
          .limit(1);

        if (!vinculo || vinculo.status !== "processando") {
          throw new ErroOrquestrador("CONTEXTO_INCONSISTENTE");
        }

        await transacao
          .update(atendimentoIaMensagensTable)
          .set({ atualizadoEm: new Date(), status: dados.proximoEstado })
          .where(eq(atendimentoIaMensagensTable.id, dados.mensagemId));

        const agora = new Date();
        await transacao
          .update(atendimentoIaExecucoesTable)
          .set({
            atualizadoEm: agora,
            concluidoEm: agora,
            duracaoEmMs: dados.resultado.metadados.duracaoEmMs,
            modelo: dados.resultado.metadados.modelo,
            motivoEscalonamento: dados.resultado.metadados.motivoEscalonamento,
            status: "concluida",
            tokensEntrada: dados.resultado.metadados.tokensEntrada,
            tokensSaida: dados.resultado.metadados.tokensSaida,
          })
          .where(eq(atendimentoIaExecucoesTable.id, dados.execucaoId));

        let mensagemRespostaId: string | null = null;
        if (dados.resultado.tipo === "encaminhar_geracao_resposta") {
          const [mensagemResposta] = await transacao
            .insert(atendimentoIaMensagensTable)
            .values({
              autor: "assistente_ia",
              chaveIdempotencia: `resposta_modelo:${dados.execucaoId}`,
              conteudo: dados.resultado.conteudoResposta,
              conversaId: vinculo.conversaId,
              status: "gerando_resposta",
            })
            .returning({ id: atendimentoIaMensagensTable.id });
          if (!mensagemResposta) {
            throw new ErroOrquestrador("PERSISTENCIA_INDISPONIVEL");
          }
          mensagemRespostaId = mensagemResposta.id;
        }

        await transacao
          .update(atendimentoIaIdempotenciasTable)
          .set({ atualizadoEm: new Date(), status: "concluida" })
          .where(
            and(
              eq(
                atendimentoIaIdempotenciasTable.escopo,
                ESCOPO_IDEMPOTENCIA_ORQUESTRADOR,
              ),
              eq(atendimentoIaIdempotenciasTable.chave, dados.mensagemId),
              eq(
                atendimentoIaIdempotenciasTable.referenciaResultado,
                dados.execucaoId,
              ),
            ),
          );

        await transacao.insert(atendimentoIaAuditoriasTable).values({
          conversaId: vinculo.conversaId,
          evento: "orquestracao_encaminhada",
          execucaoId: dados.execucaoId,
          mensagemId: dados.mensagemId,
          metadados: { proximoEstado: dados.proximoEstado },
          tipoAtor: "sistema",
        });

        await transacao.insert(atendimentoIaAuditoriasTable).values({
          conversaId: vinculo.conversaId,
          evento: "resposta_openai_validada",
          execucaoId: dados.execucaoId,
          mensagemId: mensagemRespostaId ?? dados.mensagemId,
          metadados: {
            modelo: dados.resultado.metadados.modelo,
            respostaId: dados.resultado.metadados.respostaId,
          },
          tipoAtor: "sistema",
        });

        return { mensagemRespostaId };
      });
    } catch (erro) {
      if (erro instanceof ErroOrquestrador) throw erro;
      throw new ErroOrquestrador("PERSISTENCIA_INDISPONIVEL");
    }
  }

  async registrarFalha(dados: {
    classificacao: "recuperavel" | "definitiva";
    execucaoId: string;
    mensagemId: string;
    tipo:
      | "modelo_indisponivel"
      | "ferramenta_indisponivel"
      | "integracao_indisponivel"
      | "falta_autorizacao"
      | "limite_excedido"
      | "ausencia_dado_oficial"
      | "conflito_fontes"
      | "erro_interno";
  }) {
    try {
      await dbTransacional.transaction(async (transacao) => {
        const [vinculo] = await transacao
          .select({
            conversaId: atendimentoIaMensagensTable.conversaId,
            status: atendimentoIaMensagensTable.status,
          })
          .from(atendimentoIaMensagensTable)
          .innerJoin(
            atendimentoIaExecucoesTable,
            and(
              eq(atendimentoIaExecucoesTable.id, dados.execucaoId),
              eq(
                atendimentoIaExecucoesTable.mensagemId,
                atendimentoIaMensagensTable.id,
              ),
              eq(atendimentoIaExecucoesTable.status, "processando"),
            ),
          )
          .innerJoin(
            atendimentoIaIdempotenciasTable,
            and(
              eq(
                atendimentoIaIdempotenciasTable.escopo,
                ESCOPO_IDEMPOTENCIA_ORQUESTRADOR,
              ),
              eq(atendimentoIaIdempotenciasTable.chave, dados.mensagemId),
              eq(
                atendimentoIaIdempotenciasTable.referenciaResultado,
                dados.execucaoId,
              ),
              eq(atendimentoIaIdempotenciasTable.status, "processando"),
            ),
          )
          .where(eq(atendimentoIaMensagensTable.id, dados.mensagemId))
          .limit(1);
        if (!vinculo || vinculo.status !== "processando") {
          throw new ErroOrquestrador("CONTEXTO_INCONSISTENTE");
        }

        if (dados.classificacao === "definitiva") {
          validarTransicaoOrquestrador("processando", "falhou");
          await transacao
            .update(atendimentoIaMensagensTable)
            .set({ atualizadoEm: new Date(), status: "falhou" })
            .where(
              and(
                eq(atendimentoIaMensagensTable.id, dados.mensagemId),
                eq(atendimentoIaMensagensTable.status, "processando"),
              ),
            );
        }

        const agora = new Date();
        await transacao
          .update(atendimentoIaExecucoesTable)
          .set({
            atualizadoEm: agora,
            concluidoEm: agora,
            erro: `${dados.classificacao}:${dados.tipo}`,
            status: "falhou",
          })
          .where(eq(atendimentoIaExecucoesTable.id, dados.execucaoId));

        await transacao
          .update(atendimentoIaIdempotenciasTable)
          .set({ atualizadoEm: agora, status: "falhou" })
          .where(
            and(
              eq(
                atendimentoIaIdempotenciasTable.escopo,
                ESCOPO_IDEMPOTENCIA_ORQUESTRADOR,
              ),
              eq(atendimentoIaIdempotenciasTable.chave, dados.mensagemId),
              eq(
                atendimentoIaIdempotenciasTable.referenciaResultado,
                dados.execucaoId,
              ),
            ),
          );

        await transacao.insert(atendimentoIaOcorrenciasTable).values({
          conversaId: vinculo.conversaId,
          descricaoSanitizada: `Falha ${dados.classificacao} durante a orquestração.`,
          execucaoId: dados.execucaoId,
          mensagemId: dados.mensagemId,
          recuperacaoTentada: false,
          tipo: dados.tipo,
        });
        await transacao.insert(atendimentoIaAuditoriasTable).values({
          conversaId: vinculo.conversaId,
          evento: "orquestracao_falhou",
          execucaoId: dados.execucaoId,
          mensagemId: dados.mensagemId,
          metadados: {
            classificacao: dados.classificacao,
            tipo: dados.tipo,
          },
          tipoAtor: "sistema",
        });
      });
    } catch (erro) {
      if (erro instanceof ErroOrquestrador) throw erro;
      throw new ErroOrquestrador("PERSISTENCIA_INDISPONIVEL");
    }
  }

  private async buscarExecucaoDaReivindicacao(
    transacao: Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0],
    mensagemId: string,
  ) {
    const [idempotencia] = await transacao
      .select({
        referencia: atendimentoIaIdempotenciasTable.referenciaResultado,
      })
      .from(atendimentoIaIdempotenciasTable)
      .where(
        and(
          eq(
            atendimentoIaIdempotenciasTable.escopo,
            ESCOPO_IDEMPOTENCIA_ORQUESTRADOR,
          ),
          eq(atendimentoIaIdempotenciasTable.chave, mensagemId),
        ),
      )
      .limit(1);
    if (!idempotencia?.referencia) return null;

    const [execucao] = await transacao
      .select({
        id: atendimentoIaExecucoesTable.id,
        status: atendimentoIaExecucoesTable.status,
      })
      .from(atendimentoIaExecucoesTable)
      .where(eq(atendimentoIaExecucoesTable.id, idempotencia.referencia))
      .limit(1);
    return execucao ?? null;
  }

  private async adquirirReivindicacao(
    transacao: Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0],
    mensagemId: string,
  ) {
    const agora = new Date();
    const expiraEm = new Date(
      agora.getTime() + DURACAO_REIVINDICACAO_ORQUESTRADOR_EM_MS,
    );
    const [criada] = await transacao
      .insert(atendimentoIaIdempotenciasTable)
      .values({
        chave: mensagemId,
        escopo: ESCOPO_IDEMPOTENCIA_ORQUESTRADOR,
        expiraEm,
        hashRequisicao: mensagemId,
        status: "processando",
      })
      .onConflictDoNothing()
      .returning({ id: atendimentoIaIdempotenciasTable.id });
    if (criada) return criada;

    const [retomada] = await transacao
      .update(atendimentoIaIdempotenciasTable)
      .set({
        atualizadoEm: agora,
        expiraEm,
        referenciaResultado: null,
        status: "processando",
      })
      .where(
        and(
          eq(
            atendimentoIaIdempotenciasTable.escopo,
            ESCOPO_IDEMPOTENCIA_ORQUESTRADOR,
          ),
          eq(atendimentoIaIdempotenciasTable.chave, mensagemId),
          or(
            eq(atendimentoIaIdempotenciasTable.status, "falhou"),
            and(
              eq(atendimentoIaIdempotenciasTable.status, "processando"),
              lt(atendimentoIaIdempotenciasTable.expiraEm, agora),
            ),
          ),
        ),
      )
      .returning({ id: atendimentoIaIdempotenciasTable.id });
    return retomada ?? null;
  }

  private async carregarContexto(
    transacao: Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0],
    registro: {
      conversa: ContextoPersistidoOrquestrador["conversa"];
      mensagem: ContextoPersistidoOrquestrador["mensagemAtual"] & {
        conversaId: string;
      };
    },
    memoriaAtiva: boolean,
  ): Promise<ContextoPersistidoOrquestrador> {
    const [estado] = await transacao
      .select({
        estadoEstruturado: atendimentoIaEstadosTable.estadoEstruturado,
        etapaAtual: atendimentoIaEstadosTable.etapaAtual,
        intencaoAtual: atendimentoIaEstadosTable.intencaoAtual,
        versao: atendimentoIaEstadosTable.versao,
      })
      .from(atendimentoIaEstadosTable)
      .where(eq(atendimentoIaEstadosTable.conversaId, registro.conversa.id))
      .limit(1);
    if (!estado) throw new ErroOrquestrador("CONTEXTO_INCONSISTENTE");

    const mensagensDesc = await transacao
      .select({
        autor: atendimentoIaMensagensTable.autor,
        conteudo: atendimentoIaMensagensTable.conteudo,
        criadoEm: atendimentoIaMensagensTable.criadoEm,
        id: atendimentoIaMensagensTable.id,
        status: atendimentoIaMensagensTable.status,
      })
      .from(atendimentoIaMensagensTable)
      .where(
        and(
          eq(atendimentoIaMensagensTable.conversaId, registro.conversa.id),
          lt(atendimentoIaMensagensTable.criadoEm, registro.mensagem.criadoEm),
        ),
      )
      .orderBy(desc(atendimentoIaMensagensTable.criadoEm))
      .limit(LIMITE_MENSAGENS_CONTEXTO_ORQUESTRADOR);

    const [resumo] = await transacao
      .select({
        ateMensagemId: atendimentoIaResumosTable.ateMensagemId,
        conteudo: atendimentoIaResumosTable.conteudo,
        resumoEstruturado: atendimentoIaResumosTable.resumoEstruturado,
      })
      .from(atendimentoIaResumosTable)
      .where(eq(atendimentoIaResumosTable.conversaId, registro.conversa.id))
      .orderBy(desc(atendimentoIaResumosTable.criadoEm))
      .limit(1);

    let memoriaPermitida: ContextoPersistidoOrquestrador["memoriaPermitida"] =
      [];
    if (memoriaAtiva && registro.conversa.usuarioId) {
      memoriaPermitida = await transacao
        .select({
          categoria: atendimentoIaMemoriasTable.categoria,
          origem: atendimentoIaMemoriasTable.origem,
          valorEstruturado: atendimentoIaMemoriasTable.valorEstruturado,
        })
        .from(atendimentoIaMemoriasTable)
        .where(
          and(
            eq(
              atendimentoIaMemoriasTable.usuarioId,
              registro.conversa.usuarioId,
            ),
            eq(atendimentoIaMemoriasTable.restrita, false),
            isNull(atendimentoIaMemoriasTable.removidaEm),
            or(
              isNull(atendimentoIaMemoriasTable.expiraEm),
              gt(atendimentoIaMemoriasTable.expiraEm, new Date()),
            ),
          ),
        );
    }

    return {
      conversa: registro.conversa,
      estado,
      memoriaPermitida,
      mensagemAtual: {
        autor: registro.mensagem.autor,
        conteudo: registro.mensagem.conteudo,
        criadoEm: registro.mensagem.criadoEm,
        id: registro.mensagem.id,
        status: registro.mensagem.status,
      },
      mensagensAnteriores: mensagensDesc.reverse(),
      resumo: resumo ?? null,
    };
  }
}
