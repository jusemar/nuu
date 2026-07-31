import { createHash } from "node:crypto";

import {
  MODELO_ESCALONAMENTO_ATENDENTE_IA,
  MODELO_PRINCIPAL_ATENDENTE_IA,
} from "../constants/configuracao-atendente";
import { MAXIMO_CHAMADAS_FERRAMENTAS_POR_EXECUCAO } from "../constants/ferramentas-publicas";
import { INSTRUCOES_SISTEMA_ATENDENTE_IA } from "../constants/instrucoes-openai";
import {
  criteriosEscalonamentoModelo,
  respostaEstruturadaOpenAiSchema,
  schemaJsonRespostaOpenAi,
} from "../schemas/resposta-openai.schema";
import type {
  DefinicaoFerramentaOpenAi,
  ExecutorFerramentasPublicas,
  SolicitacaoFerramentaModelo,
} from "../types/ferramentas-publicas";
import type {
  ClienteResponsesOpenAi,
  ConfiguracaoIntegracaoOpenAi,
  DadosPermitidosModelo,
  RequisicaoResponsesOpenAi,
  RespostaResponsesOpenAi,
} from "../types/integracao-openai";
import { ErroClienteResponsesOpenAi } from "../types/integracao-openai";
import {
  type ComponenteProcessamentoOrquestrado,
  type ContextoPersistidoOrquestrador,
  type CriterioEscalonamentoModelo,
  FalhaComponenteOrquestrado,
  type MetadadosExecucaoModelo,
  type ResultadoComponenteOrquestrado,
} from "../types/orquestrador";

type ResultadoModeloValidado = {
  criterioEscalonamento: CriterioEscalonamentoModelo | null;
  encaminhamento:
    | "gerar_resposta"
    | "solicitar_ferramenta_futura"
    | "aguardar_atendimento_humano";
  resposta: string | null;
  respostaBruta: RespostaResponsesOpenAi;
};

class ErroValidacaoRespostaModelo extends Error {}

function extrairSolicitacoesFerramentas(
  resposta: RespostaResponsesOpenAi,
): SolicitacaoFerramentaModelo[] {
  return resposta.output.flatMap((item) => {
    if (item.type !== "function_call") return [];
    if (
      typeof item.call_id !== "string" ||
      typeof item.name !== "string" ||
      typeof item.arguments !== "string"
    ) {
      throw new ErroValidacaoRespostaModelo();
    }
    return [
      {
        argumentosJson: item.arguments,
        chamadaId: item.call_id,
        nome: item.name,
      },
    ];
  });
}

function selecionarDadosPermitidos(
  contexto: ContextoPersistidoOrquestrador,
): DadosPermitidosModelo {
  return {
    estado: contexto.estado,
    memoriaPermitida: contexto.memoriaPermitida,
    mensagemAtual: {
      autor: contexto.mensagemAtual.autor,
      conteudo: contexto.mensagemAtual.conteudo,
      criadoEm: contexto.mensagemAtual.criadoEm,
      status: contexto.mensagemAtual.status,
    },
    mensagensAnteriores: contexto.mensagensAnteriores.map((mensagem) => ({
      autor: mensagem.autor,
      conteudo: mensagem.conteudo,
      criadoEm: mensagem.criadoEm,
      status: mensagem.status,
    })),
    resumo: contexto.resumo
      ? {
          conteudo: contexto.resumo.conteudo,
          resumoEstruturado: contexto.resumo.resumoEstruturado,
        }
      : null,
  };
}

function criarIdentificadorSeguranca(contexto: ContextoPersistidoOrquestrador) {
  const identificador =
    contexto.conversa.usuarioId ?? contexto.conversa.identificadorSessao;
  return createHash("sha256").update(identificador).digest("hex");
}

function validarRespostaModelo(
  resposta: RespostaResponsesOpenAi,
): ResultadoModeloValidado {
  if (
    resposta.status !== "completed" ||
    resposta.error ||
    resposta.incomplete_details
  ) {
    throw new ErroValidacaoRespostaModelo();
  }
  const texto = resposta.output_text.trim();
  if (!texto) throw new ErroValidacaoRespostaModelo();

  let valor: unknown;
  try {
    valor = JSON.parse(texto);
  } catch {
    throw new ErroValidacaoRespostaModelo();
  }
  const validacao = respostaEstruturadaOpenAiSchema.safeParse(valor);
  if (!validacao.success) throw new ErroValidacaoRespostaModelo();

  return {
    criterioEscalonamento: validacao.data.criterio_escalonamento,
    encaminhamento: validacao.data.encaminhamento,
    resposta: validacao.data.resposta,
    respostaBruta: resposta,
  };
}

function mapearResultado(
  resultado: ResultadoModeloValidado,
  metadados: MetadadosExecucaoModelo,
): ResultadoComponenteOrquestrado {
  if (resultado.encaminhamento === "gerar_resposta") {
    if (!resultado.resposta) throw new ErroValidacaoRespostaModelo();
    return {
      conteudoResposta: resultado.resposta,
      metadados,
      tipo: "encaminhar_geracao_resposta",
    };
  }
  if (resultado.encaminhamento === "solicitar_ferramenta_futura") {
    return { metadados, tipo: "aguardar_ferramenta" };
  }
  return { metadados, tipo: "aguardar_atendimento_humano" };
}

export function criarComponenteProcessamentoOpenAi(dependencias: {
  cliente: ClienteResponsesOpenAi;
  configuracao: ConfiguracaoIntegracaoOpenAi;
  executorFerramentas: ExecutorFerramentasPublicas;
  ferramentas: DefinicaoFerramentaOpenAi[];
}): ComponenteProcessamentoOrquestrado {
  async function chamarModelo(
    modelo: "gpt-5.6-terra" | "gpt-5.6-sol",
    contexto: ContextoPersistidoOrquestrador,
    input: RequisicaoResponsesOpenAi["input"],
  ) {
    const requisicao: RequisicaoResponsesOpenAi = {
      input,
      instructions: INSTRUCOES_SISTEMA_ATENDENTE_IA,
      max_output_tokens: dependencias.configuracao.maxOutputTokens,
      model: modelo,
      safety_identifier: criarIdentificadorSeguranca(contexto),
      store: false,
      stream: false,
      text: {
        format: {
          name: "decisao_atendente_ia",
          schema: schemaJsonRespostaOpenAi,
          strict: true,
          type: "json_schema",
        },
      },
      tool_choice: "auto",
      tools: dependencias.ferramentas,
      truncation: "disabled",
    };

    let ultimaFalha: unknown;
    for (
      let tentativa = 1;
      tentativa <= dependencias.configuracao.maxTentativas;
      tentativa += 1
    ) {
      try {
        return await dependencias.cliente.criar(requisicao, {
          maxRetries: 0,
          timeout: dependencias.configuracao.timeoutEmMs,
        });
      } catch (erro) {
        ultimaFalha = erro;
        if (
          !(erro instanceof ErroClienteResponsesOpenAi) ||
          ["autenticacao", "requisicao_invalida"].includes(erro.categoria)
        ) {
          break;
        }
      }
    }
    throw ultimaFalha;
  }

  return {
    async processar({ contexto, execucaoId }) {
      const inicio = Date.now();
      let tokensEntrada = 0;
      let tokensSaida = 0;
      let criterioEscalonamento: CriterioEscalonamentoModelo | null = null;
      let modeloFinal:
        | typeof MODELO_PRINCIPAL_ATENDENTE_IA
        | typeof MODELO_ESCALONAMENTO_ATENDENTE_IA =
        MODELO_PRINCIPAL_ATENDENTE_IA;
      let respostaFinal: ResultadoModeloValidado;

      try {
        respostaFinal = await executarCicloModelo(
          MODELO_PRINCIPAL_ATENDENTE_IA,
          contexto,
        );
        criterioEscalonamento ??= respostaFinal.criterioEscalonamento;

        if (
          criterioEscalonamento &&
          modeloFinal === MODELO_PRINCIPAL_ATENDENTE_IA
        ) {
          if (!dependencias.configuracao.escalonamentoAtivo) {
            throw new ErroValidacaoRespostaModelo();
          }
          respostaFinal = await executarEscalonamento();
        }

        return mapearResultado(respostaFinal, {
          duracaoEmMs: Date.now() - inicio,
          modelo: modeloFinal,
          motivoEscalonamento: criterioEscalonamento,
          respostaId: respostaFinal.respostaBruta.id,
          tokensEntrada,
          tokensSaida,
        });
      } catch (erro) {
        if (erro instanceof ErroClienteResponsesOpenAi) {
          if (
            erro.categoria === "autenticacao" ||
            erro.categoria === "requisicao_invalida"
          ) {
            throw new FalhaComponenteOrquestrado(
              "definitiva",
              erro.categoria === "autenticacao"
                ? "falta_autorizacao"
                : "erro_interno",
            );
          }
          throw new FalhaComponenteOrquestrado(
            "recuperavel",
            erro.categoria === "rate_limit"
              ? "limite_excedido"
              : "modelo_indisponivel",
          );
        }
        throw new FalhaComponenteOrquestrado("definitiva", "erro_interno");
      }

      async function executarEscalonamento(): Promise<ResultadoModeloValidado> {
        modeloFinal = MODELO_ESCALONAMENTO_ATENDENTE_IA;
        const validada = await executarCicloModelo(
          MODELO_ESCALONAMENTO_ATENDENTE_IA,
          contexto,
        );
        if (validada.criterioEscalonamento) {
          throw new ErroValidacaoRespostaModelo();
        }
        return validada;
      }

      async function executarCicloModelo(
        modelo: "gpt-5.6-terra" | "gpt-5.6-sol",
        contextoAtual: ContextoPersistidoOrquestrador,
      ): Promise<ResultadoModeloValidado> {
        const entradaOriginal = JSON.stringify(
          selecionarDadosPermitidos(contextoAtual),
        );
        let input: RequisicaoResponsesOpenAi["input"] = entradaOriginal;
        const historico: Array<Record<string, unknown>> = [
          { content: entradaOriginal, role: "user" },
        ];
        let totalChamadas = 0;

        while (true) {
          let resposta: RespostaResponsesOpenAi;
          try {
            resposta = await chamarModelo(modelo, contextoAtual, input);
          } catch (erro) {
            throw erro;
          }
          tokensEntrada += resposta.usage?.input_tokens ?? 0;
          tokensSaida += resposta.usage?.output_tokens ?? 0;
          if (
            resposta.status !== "completed" ||
            resposta.error ||
            resposta.incomplete_details
          ) {
            throw new ErroValidacaoRespostaModelo();
          }

          const solicitacoes = extrairSolicitacoesFerramentas(resposta);
          if (solicitacoes.length === 0) {
            try {
              return validarRespostaModelo(resposta);
            } catch (erro) {
              if (
                modelo === MODELO_PRINCIPAL_ATENDENTE_IA &&
                erro instanceof ErroValidacaoRespostaModelo &&
                dependencias.configuracao.escalonamentoAtivo
              ) {
                criterioEscalonamento = "falha_validacao_resposta";
                return executarEscalonamento();
              }
              throw erro;
            }
          }
          totalChamadas += solicitacoes.length;
          if (
            totalChamadas > MAXIMO_CHAMADAS_FERRAMENTAS_POR_EXECUCAO ||
            resposta.output_text.trim()
          ) {
            throw new ErroValidacaoRespostaModelo();
          }

          const saidas = [];
          for (const solicitacao of solicitacoes) {
            const retorno = await dependencias.executorFerramentas.executar({
              ...solicitacao,
              execucaoId,
            });
            saidas.push({
              call_id: solicitacao.chamadaId,
              output: JSON.stringify(retorno),
              type: "function_call_output" as const,
            });
          }
          historico.push(...resposta.output, ...saidas);
          input = historico;
        }
      }
    },
  };
}

export function criterioEscalonamentoAprovado(valor: string) {
  return criteriosEscalonamentoModelo.includes(
    valor as (typeof criteriosEscalonamentoModelo)[number],
  );
}
