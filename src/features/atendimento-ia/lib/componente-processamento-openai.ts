import { createHash } from "node:crypto";

import type { ZodIssue } from "zod";

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
import {
  estimarTokensSeguro,
  montarContextoControlado,
} from "./contexto-controlado";

type ResultadoModeloValidado = {
  criterioEscalonamento: CriterioEscalonamentoModelo | null;
  encaminhamento:
    | "gerar_resposta"
    | "solicitar_ferramenta_futura"
    | "aguardar_atendimento_humano";
  resposta: string | null;
  respostaBruta: RespostaResponsesOpenAi;
  transferencia: {
    explicacao: string;
    motivo: import("../types/transferencia-humana").MotivoTransferenciaHumana;
  } | null;
};

type CategoriaValidacaoResposta =
  | "json_invalido"
  | "resposta_incompleta"
  | "schema_incompativel"
  | "saida_vazia";

class ErroValidacaoRespostaModelo extends Error {
  readonly schema = "decisao_atendente_ia";

  constructor(
    readonly categoria: CategoriaValidacaoResposta,
    readonly campos: string[] = [],
    readonly resposta?: RespostaResponsesOpenAi,
  ) {
    super("RESPOSTA_MODELO_INVALIDA");
    this.name = "ErroValidacaoRespostaModelo";
  }
}

function camposInvalidosSchema(problemas: ZodIssue[], valor: unknown) {
  const caminhoPresente = (caminho: PropertyKey[]) => {
    let atual = valor;
    for (const parte of caminho) {
      if (
        !atual ||
        typeof atual !== "object" ||
        !Object.prototype.hasOwnProperty.call(atual, parte)
      )
        return false;
      atual = (atual as Record<PropertyKey, unknown>)[parte];
    }
    return true;
  };
  const campos = problemas.flatMap((problema) => {
    if (problema.code === "unrecognized_keys" && problema.keys?.length) {
      return problema.keys.map((chave) => `inesperado:${chave}`);
    }
    const caminho = problema.path.length
      ? problema.path.map(String).join(".")
      : "raiz";
    return [
      `${problema.code === "invalid_type" && !caminhoPresente(problema.path) ? "ausente" : "invalido"}:${caminho}`,
    ];
  });
  return [...new Set(campos)].sort().slice(0, 12);
}

function registrarFalhaValidacaoResposta(erro: ErroValidacaoRespostaModelo) {
  console.error("[atendimento-ia:validacao-resposta]", {
    campos: erro.campos,
    categoria: erro.categoria,
    etapa: "validacao_resposta_openai",
    modelo: erro.resposta?.model ?? null,
    requestId: erro.resposta?.request_id ?? null,
    schema: erro.schema,
  });
}

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
      throw new ErroValidacaoRespostaModelo(
        "schema_incompativel",
        ["invalido:output.function_call"],
        resposta,
      );
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

function criarIdentificadorSeguranca(contexto: ContextoPersistidoOrquestrador) {
  const identificador =
    contexto.conversa.usuarioId ?? contexto.conversa.identificadorSessao;
  return createHash("sha256").update(identificador).digest("hex");
}

function criarHashSessao(contexto: ContextoPersistidoOrquestrador) {
  return createHash("sha256")
    .update(contexto.conversa.identificadorSessao, "utf8")
    .digest("hex");
}

function estimarTokensEntradaModelo(
  input: RequisicaoResponsesOpenAi["input"],
  instrucoesSistema = INSTRUCOES_SISTEMA_ATENDENTE_IA,
) {
  const estimarItem = (item: Record<string, unknown>) => {
    let custo = 0;
    const estrutura = { ...item };
    for (const campo of ["content", "output", "arguments"] as const) {
      if (typeof estrutura[campo] === "string") {
        custo += estimarTokensSeguro(estrutura[campo]);
        estrutura[campo] = "";
      }
    }
    return custo + estimarTokensSeguro(estrutura);
  };
  return (
    estimarTokensSeguro(instrucoesSistema) +
    (typeof input === "string"
      ? estimarTokensSeguro(input)
      : input.reduce((total, item) => total + estimarItem(item), 0))
  );
}

function validarRespostaModelo(
  resposta: RespostaResponsesOpenAi,
): ResultadoModeloValidado {
  if (
    resposta.status !== "completed" ||
    resposta.error ||
    resposta.incomplete_details
  ) {
    throw new ErroValidacaoRespostaModelo(
      "resposta_incompleta",
      ["invalido:status"],
      resposta,
    );
  }
  const texto = resposta.output_text.trim();
  if (!texto)
    throw new ErroValidacaoRespostaModelo(
      "saida_vazia",
      ["ausente:output_text"],
      resposta,
    );

  let valor: unknown;
  try {
    valor = JSON.parse(texto);
  } catch {
    throw new ErroValidacaoRespostaModelo("json_invalido", [], resposta);
  }
  const validacao = respostaEstruturadaOpenAiSchema.safeParse(valor);
  if (!validacao.success) {
    throw new ErroValidacaoRespostaModelo(
      "schema_incompativel",
      camposInvalidosSchema(validacao.error.issues, valor),
      resposta,
    );
  }

  const decisao = validacao.data.decisao;

  return {
    criterioEscalonamento: validacao.data.criterio_escalonamento,
    encaminhamento: decisao.encaminhamento,
    resposta: decisao.resposta,
    respostaBruta: resposta,
    transferencia: decisao.transferencia,
  };
}

function mapearResultado(
  resultado: ResultadoModeloValidado,
  metadados: MetadadosExecucaoModelo,
): ResultadoComponenteOrquestrado {
  if (resultado.encaminhamento === "gerar_resposta") {
    if (!resultado.resposta) {
      throw new ErroValidacaoRespostaModelo(
        "schema_incompativel",
        ["ausente:decisao.resposta"],
        resultado.respostaBruta,
      );
    }
    return {
      conteudoResposta: resultado.resposta,
      metadados,
      tipo: "encaminhar_geracao_resposta",
    };
  }
  if (resultado.encaminhamento === "solicitar_ferramenta_futura") {
    if (!resultado.resposta || !resultado.transferencia) {
      throw new ErroValidacaoRespostaModelo(
        "schema_incompativel",
        ["ausente:decisao.resposta_ou_transferencia"],
        resultado.respostaBruta,
      );
    }
    return {
      explicacaoOferta: resultado.transferencia.explicacao,
      metadados,
      motivo: resultado.transferencia.motivo,
      tipo: "aguardar_atendimento_humano",
    };
  }
  if (!resultado.transferencia) {
    throw new ErroValidacaoRespostaModelo(
      "schema_incompativel",
      ["ausente:decisao.transferencia"],
      resultado.respostaBruta,
    );
  }
  return {
    explicacaoOferta: resultado.transferencia.explicacao,
    metadados,
    motivo: resultado.transferencia.motivo,
    tipo: "aguardar_atendimento_humano",
  };
}

export function criarComponenteProcessamentoOpenAi(dependencias: {
  cliente: ClienteResponsesOpenAi;
  configuracao: ConfiguracaoIntegracaoOpenAi;
  executorFerramentas: ExecutorFerramentasPublicas;
  ferramentas: DefinicaoFerramentaOpenAi[];
  /** Resolvida exclusivamente no servidor; nunca aceita entrada da requisição pública. */
  instrucoesSistema?: string;
}): ComponenteProcessamentoOrquestrado {
  const instrucoesSistema =
    dependencias.instrucoesSistema ?? INSTRUCOES_SISTEMA_ATENDENTE_IA;
  async function chamarModelo(
    modelo: "gpt-5.6-terra" | "gpt-5.6-sol",
    contexto: ContextoPersistidoOrquestrador,
    input: RequisicaoResponsesOpenAi["input"],
  ) {
    const requisicao: RequisicaoResponsesOpenAi = {
      input,
      instructions: instrucoesSistema,
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
          ["autenticacao", "quota", "requisicao_invalida"].includes(
            erro.categoria,
          )
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
          if (dependencias.configuracao.escalonamentoAtivo) {
            respostaFinal = await executarEscalonamento();
          }
        }

        return mapearResultado(respostaFinal, {
          duracaoEmMs: Date.now() - inicio,
          modelo: modeloFinal,
          motivoEscalonamento: criterioEscalonamento,
          respostaId: respostaFinal.respostaBruta.id,
          requestId: respostaFinal.respostaBruta.request_id ?? null,
          tokensEntrada,
          tokensSaida,
        });
      } catch (erro) {
        if (erro instanceof ErroValidacaoRespostaModelo) {
          registrarFalhaValidacaoResposta(erro);
        }
        if (erro instanceof FalhaComponenteOrquestrado) throw erro;
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
            erro.categoria === "rate_limit" || erro.categoria === "quota"
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
          throw new ErroValidacaoRespostaModelo(
            "schema_incompativel",
            ["invalido:criterio_escalonamento"],
            validada.respostaBruta,
          );
        }
        return validada;
      }

      async function executarCicloModelo(
        modelo: "gpt-5.6-terra" | "gpt-5.6-sol",
        contextoAtual: ContextoPersistidoOrquestrador,
      ): Promise<ResultadoModeloValidado> {
        let entradaOriginal = JSON.stringify(
          (() => {
            const controlado = montarContextoControlado(
              contextoAtual,
              {
                // Reserva o custo do envelope serializado da requisição.
                limiteTokens: dependencias.configuracao.maxContextTokens - 512,
              },
              instrucoesSistema,
            );
            if (
              controlado.tokensEstimados >
              dependencias.configuracao.maxContextTokens - 512
            ) {
              throw new FalhaComponenteOrquestrado(
                "definitiva",
                "limite_excedido",
              );
            }
            return controlado.dados satisfies DadosPermitidosModelo;
          })(),
        );
        let input: RequisicaoResponsesOpenAi["input"] = entradaOriginal;
        const historico: Array<Record<string, unknown>> = [
          { content: entradaOriginal, role: "user" },
        ];
        let totalChamadas = 0;
        let tokensEntradaProjetados: number | null = null;

        while (true) {
          const custoInputEstimado = estimarTokensEntradaModelo(
            input,
            instrucoesSistema,
          );
          if (
            (tokensEntradaProjetados ?? custoInputEstimado) >
            dependencias.configuracao.maxContextTokens
          ) {
            throw new FalhaComponenteOrquestrado(
              "definitiva",
              "limite_excedido",
            );
          }
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
            throw new ErroValidacaoRespostaModelo(
              "resposta_incompleta",
              ["invalido:status"],
              resposta,
            );
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
            throw new ErroValidacaoRespostaModelo(
              "schema_incompativel",
              ["invalido:output.function_call"],
              resposta,
            );
          }

          const saidas = [];
          for (const solicitacao of solicitacoes) {
            const retorno = await dependencias.executorFerramentas.executar({
              ...solicitacao,
              contextoSeguro: {
                conversaId: contextoAtual.conversa.id,
                execucaoId,
                identificadorSessaoHash: criarHashSessao(contextoAtual),
                usuarioIdEsperado: contextoAtual.conversa.usuarioId,
              },
              execucaoId,
            });
            saidas.push({
              call_id: solicitacao.chamadaId,
              output: JSON.stringify(retorno),
              type: "function_call_output" as const,
            });
          }
          const itensTecnicos = [
            ...historico.slice(1),
            ...resposta.output,
            ...saidas,
          ];
          let proximoHistorico: Array<Record<string, unknown>> = [
            { content: entradaOriginal, role: "user" },
            ...itensTecnicos,
          ];
          // A estimativa local por bytes é deliberadamente conservadora. Após
          // a primeira resposta, usamos a contagem real devolvida pela API para
          // calibrar a projeção da continuação e evitar um falso estouro.
          const proporcaoReal = resposta.usage?.input_tokens
            ? Math.max(0.25, resposta.usage.input_tokens / custoInputEstimado)
            : 1;
          const projetarTokens = (valor: RequisicaoResponsesOpenAi["input"]) =>
            Math.ceil(
              estimarTokensEntradaModelo(valor, instrucoesSistema) *
                proporcaoReal,
            );
          let tokensProjetados = projetarTokens(proximoHistorico);

          if (tokensProjetados > dependencias.configuracao.maxContextTokens) {
            const margemEstrutural = 512;
            const limiteContextoConversa = Math.floor(
              dependencias.configuracao.maxContextTokens / proporcaoReal -
                estimarTokensSeguro(itensTecnicos) -
                margemEstrutural,
            );
            const contextoRecompactado = montarContextoControlado(
              contextoAtual,
              { limiteTokens: limiteContextoConversa },
              instrucoesSistema,
            );
            if (
              limiteContextoConversa > 0 &&
              contextoRecompactado.tokensEstimados <= limiteContextoConversa
            ) {
              entradaOriginal = JSON.stringify(contextoRecompactado.dados);
              proximoHistorico = [
                { content: entradaOriginal, role: "user" },
                ...itensTecnicos,
              ];
              tokensProjetados = projetarTokens(proximoHistorico);
            }
          }

          if (tokensProjetados > dependencias.configuracao.maxContextTokens) {
            console.error("[atendimento-ia:orcamento-contexto]", {
              categoria: "orcamento_contexto_excedido",
              chamadasFerramenta: totalChamadas,
              etapa: "projecao_apos_ferramenta",
              limiteTokens: dependencias.configuracao.maxContextTokens,
              temporaria: false,
            });
            throw new FalhaComponenteOrquestrado(
              "definitiva",
              "limite_excedido",
            );
          }
          historico.length = 0;
          historico.push(...proximoHistorico);
          input = historico;
          tokensEntradaProjetados = tokensProjetados;
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
