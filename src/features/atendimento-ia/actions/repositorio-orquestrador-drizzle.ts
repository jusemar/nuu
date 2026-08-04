import "server-only";

import { createHash } from "node:crypto";

import { and, desc, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";

import {
  atendimentoIaAuditoriasTable,
  atendimentoIaAutorizacoesMemoriaTable,
  atendimentoIaConversasTable,
  atendimentoIaEstadosTable,
  atendimentoIaExecucoesFerramentasTable,
  atendimentoIaExecucoesTable,
  atendimentoIaIdempotenciasTable,
  atendimentoIaMemoriasTable,
  atendimentoIaMensagensTable,
  atendimentoIaOcorrenciasTable,
  atendimentoIaResumosTable,
  atendimentoIaTransferenciasTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { CATEGORIAS_MEMORIA_AUTORIZADAS } from "../constants/contexto";
import {
  DURACAO_REIVINDICACAO_ORQUESTRADOR_EM_MS,
  ESCOPO_IDEMPOTENCIA_ORQUESTRADOR,
  MODELO_EXECUCAO_NAO_INICIADA,
} from "../constants/orquestrador";
import type { ComportamentoEfetivo } from "../lib/admin/publicacao/resolver-versao-publicada-comportamento";
import { conversaPertenceAIdentidade } from "../lib/seguranca-entrada-mensagem";
import { validarTransicaoOrquestrador } from "../lib/transicoes-orquestrador";
import type {
  ContextoPersistidoOrquestrador,
  ReivindicacaoOrquestracao,
  RepositorioOrquestrador,
  ResultadoComponenteOrquestrado,
} from "../types/orquestrador";
import type { RepositorioResumoContexto } from "../types/resumo";

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

export class RepositorioOrquestradorDrizzle
  implements RepositorioOrquestrador, RepositorioResumoContexto
{
  constructor(private readonly comportamentoEfetivo?: ComportamentoEfetivo) {}
  async reivindicarProcessamento(dados: {
    contextoExpiraAposDias?: number;
    identidade: {
      identificadorSessao: string;
      usuarioId: string | null;
    };
    memoriaAtiva: boolean;
    memoriaExpiraAposDias?: number;
    mensagemId: string;
  }): Promise<ReivindicacaoOrquestracao> {
    try {
      return await dbTransacional.transaction(async (transacao) => {
        const [registro] = await transacao
          .select({
            conversa: {
              canal: atendimentoIaConversasTable.canal,
              avisoPrivacidadeVersao:
                atendimentoIaConversasTable.avisoPrivacidadeVersao,
              id: atendimentoIaConversasTable.id,
              identificadorSessao:
                atendimentoIaConversasTable.identificadorSessao,
              status: atendimentoIaConversasTable.status,
              inicioVoluntarioEm:
                atendimentoIaConversasTable.inicioVoluntarioEm,
              ultimaAtividadeEm: atendimentoIaConversasTable.ultimaAtividadeEm,
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
        if (
          registro.conversa.avisoPrivacidadeVersao !==
            "atendente-ia-contexto-v1" ||
          !registro.conversa.inicioVoluntarioEm
        ) {
          throw new ErroOrquestrador("CONVERSA_INDISPONIVEL");
        }
        if (
          dados.contextoExpiraAposDias &&
          registro.conversa.ultimaAtividadeEm <
            new Date(Date.now() - dados.contextoExpiraAposDias * 86_400_000)
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
            tipoExecucao: "publica",
            comportamentoVersaoId: this.comportamentoEfetivo?.versaoId,
            identidadePublicacao:
              this.comportamentoEfetivo?.identidadePublicacao,
            fallbackComportamento: this.comportamentoEfetivo?.fallback ?? true,
            hashConfiguracaoEfetiva:
              this.comportamentoEfetivo?.hashConfiguracao,
            versaoCatalogoFerramentas: "catalogo-ferramentas-v1",
            versaoSchemaResposta: "decisao-atendente-ia-v1",
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
          execucao.id,
          dados.memoriaExpiraAposDias,
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
            identificadorSessao:
              atendimentoIaConversasTable.identificadorSessao,
            status: atendimentoIaMensagensTable.status,
            usuarioId: atendimentoIaConversasTable.usuarioId,
          })
          .from(atendimentoIaMensagensTable)
          .innerJoin(
            atendimentoIaConversasTable,
            eq(
              atendimentoIaConversasTable.id,
              atendimentoIaMensagensTable.conversaId,
            ),
          )
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
        let transferenciaId: string | null = null;
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
        if (dados.resultado.tipo === "aguardar_atendimento_humano") {
          const [mensagemOferta] = await transacao
            .insert(atendimentoIaMensagensTable)
            .values({
              autor: "assistente_ia",
              chaveIdempotencia: `oferta_transferencia:${dados.execucaoId}`,
              conteudo: dados.resultado.explicacaoOferta,
              conversaId: vinculo.conversaId,
              status: "concluida",
            })
            .onConflictDoNothing()
            .returning({ id: atendimentoIaMensagensTable.id });
          mensagemRespostaId = mensagemOferta?.id ?? null;
          const [transferencia] = await transacao
            .insert(atendimentoIaTransferenciasTable)
            .values({
              canal: "whatsapp",
              chaveIdempotencia: `oferta_transferencia:${dados.execucaoId}`,
              conversaId: vinculo.conversaId,
              execucaoSolicitacaoId: dados.execucaoId,
              mensagemSolicitacaoId: dados.mensagemId,
              motivo: dados.resultado.motivo,
              referenciaSessaoHash: createHash("sha256")
                .update(vinculo.identificadorSessao, "utf8")
                .digest("hex"),
              resumo: "",
              status: "oferecido",
              usuarioId: vinculo.usuarioId,
            })
            .onConflictDoNothing()
            .returning({ id: atendimentoIaTransferenciasTable.id });
          if (!transferencia) {
            const [existente] = await transacao
              .select({ id: atendimentoIaTransferenciasTable.id })
              .from(atendimentoIaTransferenciasTable)
              .where(
                eq(
                  atendimentoIaTransferenciasTable.chaveIdempotencia,
                  `oferta_transferencia:${dados.execucaoId}`,
                ),
              )
              .limit(1);
            transferenciaId = existente?.id ?? null;
          } else transferenciaId = transferencia.id;
          if (!transferenciaId)
            throw new ErroOrquestrador("PERSISTENCIA_INDISPONIVEL");
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
            requestId: dados.resultado.metadados.requestId,
          },
          tipoAtor: "sistema",
        });

        return { mensagemRespostaId, transferenciaId };
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

  async buscarResumoPorExecucao(execucaoId: string) {
    const [resumo] = await dbTransacional
      .select({
        ateMensagemId: atendimentoIaResumosTable.ateMensagemId,
        conteudo: atendimentoIaResumosTable.conteudo,
        criadoEm: atendimentoIaResumosTable.criadoEm,
        hashConteudoConsiderado:
          atendimentoIaResumosTable.hashConteudoConsiderado,
        quantidadeMensagens: atendimentoIaResumosTable.quantidadeMensagens,
        resumoEstruturado: atendimentoIaResumosTable.resumoEstruturado,
        versao: atendimentoIaResumosTable.versao,
      })
      .from(atendimentoIaResumosTable)
      .where(
        and(
          eq(atendimentoIaResumosTable.execucaoGeradoraId, execucaoId),
          eq(atendimentoIaResumosTable.situacao, "valido"),
        ),
      )
      .limit(1);
    return resumo ?? null;
  }

  async persistirResumo(dados: {
    ateMensagemId: string;
    conteudo: string;
    conversaId: string;
    execucaoId: string;
    hashConteudoConsiderado: string;
    quantidadeMensagens: number;
    resumoEstruturado: Record<string, unknown>;
    resumoAnteriorVersao: number | null;
  }) {
    return dbTransacional.transaction(async (transacao) => {
      const [idempotente] = await transacao
        .select()
        .from(atendimentoIaResumosTable)
        .where(
          eq(atendimentoIaResumosTable.execucaoGeradoraId, dados.execucaoId),
        )
        .limit(1);
      if (idempotente) return idempotente;

      const [anterior] = await transacao
        .select({
          id: atendimentoIaResumosTable.id,
          versao: atendimentoIaResumosTable.versao,
        })
        .from(atendimentoIaResumosTable)
        .where(
          and(
            eq(atendimentoIaResumosTable.conversaId, dados.conversaId),
            eq(atendimentoIaResumosTable.situacao, "valido"),
          ),
        )
        .orderBy(desc(atendimentoIaResumosTable.versao))
        .limit(1);
      if ((anterior?.versao ?? null) !== dados.resumoAnteriorVersao) {
        throw new ErroOrquestrador("CONTEXTO_INCONSISTENTE");
      }
      const [novo] = await transacao
        .insert(atendimentoIaResumosTable)
        .values({
          ateMensagemId: dados.ateMensagemId,
          conteudo: dados.conteudo,
          conversaId: dados.conversaId,
          execucaoGeradoraId: dados.execucaoId,
          hashConteudoConsiderado: dados.hashConteudoConsiderado,
          quantidadeMensagens: dados.quantidadeMensagens,
          resumoAnteriorId: anterior?.id ?? null,
          resumoEstruturado: dados.resumoEstruturado,
          situacao: "valido",
          versao: (anterior?.versao ?? 0) + 1,
        })
        .returning();
      if (!novo) throw new ErroOrquestrador("PERSISTENCIA_INDISPONIVEL");
      if (anterior) {
        const substituidos = await transacao
          .update(atendimentoIaResumosTable)
          .set({ atualizadoEm: new Date(), situacao: "substituido" })
          .where(
            and(
              eq(atendimentoIaResumosTable.id, anterior.id),
              eq(atendimentoIaResumosTable.situacao, "valido"),
            ),
          )
          .returning({ id: atendimentoIaResumosTable.id });
        if (substituidos.length !== 1) {
          throw new ErroOrquestrador("CONTEXTO_INCONSISTENTE");
        }
      }
      return novo;
    });
  }

  async registrarAuditoriaResumo(dados: {
    conversaId: string;
    duracaoEmMs: number;
    execucaoId: string;
    status: "concluida" | "falhou";
    tokensEntrada: number;
    tokensSaida: number;
    versao: number | null;
  }) {
    await dbTransacional.insert(atendimentoIaAuditoriasTable).values({
      conversaId: dados.conversaId,
      evento: "manutencao_resumo",
      execucaoId: dados.execucaoId,
      metadados: {
        duracaoEmMs: dados.duracaoEmMs,
        operacao: "resumo_contexto",
        origem: "responses_api",
        status: dados.status,
        tokensEntrada: dados.tokensEntrada,
        tokensSaida: dados.tokensSaida,
        versao: dados.versao,
      },
      tipoAtor: "sistema",
    });
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
    execucaoId: string,
    memoriaExpiraAposDias?: number,
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
      .orderBy(desc(atendimentoIaMensagensTable.criadoEm));

    const [resumo] = await transacao
      .select({
        ateMensagemId: atendimentoIaResumosTable.ateMensagemId,
        conteudo: atendimentoIaResumosTable.conteudo,
        resumoEstruturado: atendimentoIaResumosTable.resumoEstruturado,
        criadoEm: atendimentoIaResumosTable.criadoEm,
        hashConteudoConsiderado:
          atendimentoIaResumosTable.hashConteudoConsiderado,
        quantidadeMensagens: atendimentoIaResumosTable.quantidadeMensagens,
        versao: atendimentoIaResumosTable.versao,
      })
      .from(atendimentoIaResumosTable)
      .where(
        and(
          eq(atendimentoIaResumosTable.conversaId, registro.conversa.id),
          eq(atendimentoIaResumosTable.situacao, "valido"),
        ),
      )
      .orderBy(desc(atendimentoIaResumosTable.criadoEm))
      .limit(1);

    let memoriaPermitida: ContextoPersistidoOrquestrador["memoriaPermitida"] =
      [];
    if (memoriaAtiva && registro.conversa.usuarioId) {
      const memoriasConsultadas = await transacao
        .select({
          categoria: atendimentoIaMemoriasTable.categoria,
          assuntoNormalizado: atendimentoIaMemoriasTable.assuntoNormalizado,
          id: atendimentoIaMemoriasTable.id,
          necessidadeEncerrada: atendimentoIaMemoriasTable.necessidadeEncerrada,
          origem: atendimentoIaMemoriasTable.origem,
          valorEstruturado: atendimentoIaMemoriasTable.valorEstruturado,
        })
        .from(atendimentoIaMemoriasTable)
        .innerJoin(
          atendimentoIaAutorizacoesMemoriaTable,
          and(
            eq(
              atendimentoIaAutorizacoesMemoriaTable.id,
              atendimentoIaMemoriasTable.autorizacaoId,
            ),
            eq(
              atendimentoIaAutorizacoesMemoriaTable.usuarioId,
              registro.conversa.usuarioId,
            ),
            eq(atendimentoIaAutorizacoesMemoriaTable.situacao, "ativa"),
          ),
        )
        .where(
          and(
            eq(
              atendimentoIaMemoriasTable.usuarioId,
              registro.conversa.usuarioId,
            ),
            eq(atendimentoIaMemoriasTable.restrita, false),
            eq(atendimentoIaMemoriasTable.sensibilidade, "comercial"),
            eq(atendimentoIaMemoriasTable.situacao, "ativa"),
            inArray(
              atendimentoIaMemoriasTable.categoria,
              CATEGORIAS_MEMORIA_AUTORIZADAS,
            ),
            inArray(atendimentoIaMemoriasTable.origem, [
              "informada_cliente",
              "confirmada_sistema",
            ]),
            isNull(atendimentoIaMemoriasTable.removidaEm),
            or(
              isNull(atendimentoIaMemoriasTable.expiraEm),
              gt(atendimentoIaMemoriasTable.expiraEm, new Date()),
            ),
          ),
        );
      const renovaveis = memoriasConsultadas.filter(
        (memoria) => !memoria.necessidadeEncerrada,
      );
      if (memoriaExpiraAposDias && renovaveis.length > 0) {
        const agora = new Date();
        await transacao
          .update(atendimentoIaMemoriasTable)
          .set({
            atualizadoEm: agora,
            expiraEm: new Date(
              agora.getTime() + memoriaExpiraAposDias * 86_400_000,
            ),
            ultimaUtilizacaoValidaEm: agora,
          })
          .where(
            inArray(
              atendimentoIaMemoriasTable.id,
              renovaveis.map((memoria) => memoria.id),
            ),
          );
        await transacao.insert(atendimentoIaAuditoriasTable).values({
          conversaId: registro.conversa.id,
          evento: "memoria_curto_prazo_utilizada",
          execucaoId,
          mensagemId: registro.mensagem.id,
          metadados: {
            quantidade: renovaveis.length,
            renovacaoDias: memoriaExpiraAposDias,
            status: "concluida",
          },
          tipoAtor: "sistema",
        });
      }
      memoriaPermitida = memoriasConsultadas.map((memoria) => ({
        assuntoNormalizado: memoria.assuntoNormalizado,
        categoria: memoria.categoria,
        id: memoria.id,
        origem: memoria.origem,
        valorEstruturado: memoria.valorEstruturado,
      }));
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
      resultadosFerramentas: await transacao
        .select({
          nome: atendimentoIaExecucoesFerramentasTable.nomeFerramenta,
          resultado: atendimentoIaExecucoesFerramentasTable.resultado,
          versao: atendimentoIaExecucoesFerramentasTable.versaoFerramenta,
        })
        .from(atendimentoIaExecucoesFerramentasTable)
        .where(
          and(
            eq(atendimentoIaExecucoesFerramentasTable.execucaoId, execucaoId),
            eq(atendimentoIaExecucoesFerramentasTable.status, "concluida"),
          ),
        )
        .then((resultados) =>
          resultados.flatMap((item) =>
            item.resultado
              ? [
                  {
                    nome: item.nome,
                    resultado: item.resultado,
                    versao: item.versao,
                  },
                ]
              : [],
          ),
        ),
    };
  }
}
