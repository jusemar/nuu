import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import {
  MODELO_ESCALONAMENTO_ATENDENTE_IA,
  MODELO_PRINCIPAL_ATENDENTE_IA,
} from "../constants/configuracao-atendente";
import { configuracaoOpenAiSchema } from "../schemas/configuracao-openai.schema";
import type {
  DefinicaoFerramentaOpenAi,
  ExecutorFerramentasPublicas,
} from "../types/ferramentas-publicas";
import type {
  ClienteResponsesOpenAi,
  RequisicaoResponsesOpenAi,
  RespostaResponsesOpenAi,
} from "../types/integracao-openai";
import { ErroClienteResponsesOpenAi } from "../types/integracao-openai";
import {
  type ContextoPersistidoOrquestrador,
  FalhaComponenteOrquestrado,
} from "../types/orquestrador";
import { criarComponenteProcessamentoOpenAi } from "./componente-processamento-openai";

class ClienteResponsesTeste implements ClienteResponsesOpenAi {
  chamadas: RequisicaoResponsesOpenAi[] = [];
  fila: Array<RespostaResponsesOpenAi | Error> = [];

  async criar(requisicao: RequisicaoResponsesOpenAi) {
    this.chamadas.push(structuredClone(requisicao));
    const item = this.fila.shift();
    if (item instanceof Error) throw item;
    if (!item) throw new Error("Resposta de teste ausente");
    return item;
  }
}

function contextoTeste(): ContextoPersistidoOrquestrador {
  return {
    conversa: {
      canal: "site",
      id: "conversa-interna-nao-enviar",
      identificadorSessao: "sessao-secreta-nao-enviar",
      status: "ativa",
      usuarioId: "usuario-interno-nao-enviar",
    },
    estado: {
      estadoEstruturado: { necessidade: "uso declarado" },
      etapaAtual: "compreensao",
      intencaoAtual: "informacao_produto",
      versao: 1,
    },
    memoriaPermitida: [
      {
        categoria: "preferencia",
        origem: "informada_cliente",
        valorEstruturado: { limite: "declarado" },
      },
    ],
    mensagemAtual: {
      autor: "cliente",
      conteudo: "Preciso de ajuda.",
      criadoEm: new Date("2026-07-30T12:00:00Z"),
      id: "mensagem-interna-nao-enviar",
      status: "processando",
    },
    mensagensAnteriores: [
      {
        autor: "cliente",
        conteudo: "Contexto anterior permitido.",
        criadoEm: new Date("2026-07-30T11:59:00Z"),
        id: "mensagem-anterior-nao-enviar",
        status: "concluida",
      },
    ],
    resumo: {
      ateMensagemId: "id-resumo-nao-enviar",
      conteudo: "Resumo permitido.",
      resumoEstruturado: { pendencia: "confirmar" },
    },
  };
}

function resposta(
  dados: {
    criterio?: string | null;
    encaminhamento?:
      | "gerar_resposta"
      | "solicitar_ferramenta_futura"
      | "aguardar_atendimento_humano";
    modelo?: string;
    resposta?: string | null;
    status?: RespostaResponsesOpenAi["status"];
  } = {},
): RespostaResponsesOpenAi {
  return {
    error: null,
    id: `resp_${randomUUID()}`,
    incomplete_details:
      dados.status === "incomplete" ? { reason: "max_output_tokens" } : null,
    model: dados.modelo ?? MODELO_PRINCIPAL_ATENDENTE_IA,
    output: [],
    output_text: JSON.stringify({
      criterio_escalonamento: dados.criterio ?? null,
      encaminhamento: dados.encaminhamento ?? "gerar_resposta",
      resposta:
        dados.resposta === undefined ? "Resposta segura." : dados.resposta,
    }),
    status: dados.status ?? "completed",
    usage: { input_tokens: 30, output_tokens: 12 },
  };
}

function criarComponente(
  cliente: ClienteResponsesTeste,
  sobrescrever: Partial<{
    escalonamentoAtivo: boolean;
    maxOutputTokens: number;
    maxTentativas: number;
    timeoutEmMs: number;
  }> = {},
  executorFerramentas: ExecutorFerramentasPublicas = {
    async executar() {
      throw new Error("Ferramenta não esperada no teste.");
    },
  },
) {
  const ferramentas: DefinicaoFerramentaOpenAi[] = [
    {
      description: "Consulta produto público.",
      name: "consultar_produto_publico",
      parameters: {
        additionalProperties: false,
        properties: { slug: { type: "string" } },
        required: ["slug"],
        type: "object",
      },
      strict: true,
      type: "function",
    },
  ];
  return criarComponenteProcessamentoOpenAi({
    cliente,
    configuracao: {
      escalonamentoAtivo: false,
      maxOutputTokens: 1200,
      maxTentativas: 2,
      timeoutEmMs: 20_000,
      ...sobrescrever,
    },
    executorFerramentas,
    ferramentas,
  });
}

test("envia requisição correta ao principal com store false e schema estrito", async () => {
  const cliente = new ClienteResponsesTeste();
  cliente.fila.push(resposta());
  const resultado = await criarComponente(cliente).processar({
    contexto: contextoTeste(),
    execucaoId: randomUUID(),
  });

  assert.equal(resultado.tipo, "encaminhar_geracao_resposta");
  assert.equal(cliente.chamadas.length, 1);
  const chamada = cliente.chamadas[0];
  assert.equal(chamada.model, MODELO_PRINCIPAL_ATENDENTE_IA);
  assert.equal(chamada.store, false);
  assert.equal(chamada.stream, false);
  assert.equal(chamada.text.format.type, "json_schema");
  assert.equal(chamada.text.format.strict, true);
  assert.equal(chamada.tools.length, 1);
  assert.equal(chamada.tools[0]?.strict, true);
  assert.equal(chamada.tool_choice, "auto");
  assert.equal(chamada.truncation, "disabled");
});

test("envia somente contexto permitido e remove identificadores internos", async () => {
  const cliente = new ClienteResponsesTeste();
  cliente.fila.push(resposta());
  await criarComponente(cliente).processar({
    contexto: contextoTeste(),
    execucaoId: randomUUID(),
  });

  const entrada = cliente.chamadas[0].input;
  assert.equal(typeof entrada, "string");
  if (typeof entrada !== "string") throw new Error("Entrada inicial inválida.");
  assert.match(entrada, /Preciso de ajuda/);
  assert.match(entrada, /Resumo permitido/);
  assert.match(entrada, /preferencia/);
  assert.doesNotMatch(entrada, /conversa-interna-nao-enviar/);
  assert.doesNotMatch(entrada, /sessao-secreta-nao-enviar/);
  assert.doesNotMatch(entrada, /usuario-interno-nao-enviar/);
  assert.doesNotMatch(entrada, /mensagem-interna-nao-enviar/);
});

test("valida os três encaminhamentos autorizados", async () => {
  const casos = [
    ["gerar_resposta", "encaminhar_geracao_resposta", "Resposta segura."],
    ["solicitar_ferramenta_futura", "aguardar_ferramenta", null],
    ["aguardar_atendimento_humano", "aguardar_atendimento_humano", null],
  ] as const;

  for (const [encaminhamento, esperado, conteudo] of casos) {
    const cliente = new ClienteResponsesTeste();
    cliente.fila.push(resposta({ encaminhamento, resposta: conteudo }));
    const resultado = await criarComponente(cliente).processar({
      contexto: contextoTeste(),
      execucaoId: randomUUID(),
    });
    assert.equal(resultado.tipo, esperado);
  }
});

test("rejeita resposta vazia, schema inválido, ferramenta injetada e truncamento", async () => {
  const respostasInvalidas: RespostaResponsesOpenAi[] = [
    { ...resposta(), output_text: "" },
    { ...resposta(), output_text: '{"encaminhamento":"inexistente"}' },
    {
      ...resposta(),
      output_text:
        '{"criterio_escalonamento":null,"encaminhamento":"solicitar_ferramenta_futura","resposta":null,"ferramenta":"buscar_preco"}',
    },
    resposta({ status: "incomplete" }),
  ];

  for (const invalida of respostasInvalidas) {
    const cliente = new ClienteResponsesTeste();
    cliente.fila.push(invalida);
    await assert.rejects(
      criarComponente(cliente).processar({
        contexto: contextoTeste(),
        execucaoId: randomUUID(),
      }),
      (erro) =>
        erro instanceof FalhaComponenteOrquestrado &&
        erro.classificacao === "definitiva",
    );
  }
});

test("repete timeout, rate limit e indisponibilidade dentro do limite", async () => {
  for (const categoria of [
    "timeout",
    "rate_limit",
    "indisponibilidade",
    "cancelamento",
  ] as const) {
    const cliente = new ClienteResponsesTeste();
    cliente.fila.push(new ErroClienteResponsesOpenAi(categoria), resposta());
    const resultado = await criarComponente(cliente).processar({
      contexto: contextoTeste(),
      execucaoId: randomUUID(),
    });
    assert.equal(resultado.tipo, "encaminhar_geracao_resposta");
    assert.equal(cliente.chamadas.length, 2);
  }
});

test("converte esgotamento recuperável sem fabricar resposta", async () => {
  const cliente = new ClienteResponsesTeste();
  cliente.fila.push(
    new ErroClienteResponsesOpenAi("rate_limit"),
    new ErroClienteResponsesOpenAi("rate_limit"),
  );
  await assert.rejects(
    criarComponente(cliente).processar({
      contexto: contextoTeste(),
      execucaoId: randomUUID(),
    }),
    (erro) =>
      erro instanceof FalhaComponenteOrquestrado &&
      erro.classificacao === "recuperavel" &&
      erro.tipo === "limite_excedido",
  );
});

test("falha de autenticação é definitiva e não recebe retentativa", async () => {
  const cliente = new ClienteResponsesTeste();
  cliente.fila.push(new ErroClienteResponsesOpenAi("autenticacao"));
  await assert.rejects(
    criarComponente(cliente).processar({
      contexto: contextoTeste(),
      execucaoId: randomUUID(),
    }),
    (erro) =>
      erro instanceof FalhaComponenteOrquestrado &&
      erro.classificacao === "definitiva" &&
      erro.tipo === "falta_autorizacao",
  );
  assert.equal(cliente.chamadas.length, 1);
});

test("escalona somente sinal aprovado e registra modelo efetivo", async () => {
  const cliente = new ClienteResponsesTeste();
  cliente.fila.push(
    resposta({
      criterio: "necessidade_analise_mais_cuidadosa",
      resposta: "Resposta preliminar que exige análise mais cuidadosa.",
    }),
    resposta({
      modelo: MODELO_ESCALONAMENTO_ATENDENTE_IA,
      resposta: "Resposta após análise cuidadosa.",
    }),
  );
  const resultado = await criarComponente(cliente, {
    escalonamentoAtivo: true,
  }).processar({
    contexto: contextoTeste(),
    execucaoId: randomUUID(),
  });

  assert.equal(cliente.chamadas[0].model, MODELO_PRINCIPAL_ATENDENTE_IA);
  assert.equal(cliente.chamadas[1].model, MODELO_ESCALONAMENTO_ATENDENTE_IA);
  assert.equal(resultado.metadados.modelo, MODELO_ESCALONAMENTO_ATENDENTE_IA);
  assert.equal(
    resultado.metadados.motivoEscalonamento,
    "necessidade_analise_mais_cuidadosa",
  );
});

test("falha de validação pode escalar, mas erro externo não aciona Sol", async () => {
  const clienteValidacao = new ClienteResponsesTeste();
  clienteValidacao.fila.push(
    { ...resposta(), output_text: "" },
    resposta({
      modelo: MODELO_ESCALONAMENTO_ATENDENTE_IA,
      resposta: "Resposta validada pelo escalonamento.",
    }),
  );
  const resultado = await criarComponente(clienteValidacao, {
    escalonamentoAtivo: true,
  }).processar({
    contexto: contextoTeste(),
    execucaoId: randomUUID(),
  });
  assert.equal(resultado.metadados.modelo, MODELO_ESCALONAMENTO_ATENDENTE_IA);
  assert.equal(
    resultado.metadados.motivoEscalonamento,
    "falha_validacao_resposta",
  );

  const clienteExterno = new ClienteResponsesTeste();
  clienteExterno.fila.push(new ErroClienteResponsesOpenAi("indisponibilidade"));
  await assert.rejects(
    criarComponente(clienteExterno, {
      escalonamentoAtivo: true,
      maxTentativas: 1,
    }).processar({
      contexto: contextoTeste(),
      execucaoId: randomUUID(),
    }),
  );
  assert.equal(clienteExterno.chamadas.length, 1);
  assert.equal(clienteExterno.chamadas[0].model, MODELO_PRINCIPAL_ATENDENTE_IA);
});

test("não escalona quando a flag está desativada", async () => {
  const cliente = new ClienteResponsesTeste();
  cliente.fila.push(
    resposta({
      criterio: "dificuldade_compreensao_modelo_principal",
      resposta: "Resposta preliminar.",
    }),
  );
  await assert.rejects(
    criarComponente(cliente, { escalonamentoAtivo: false }).processar({
      contexto: contextoTeste(),
      execucaoId: randomUUID(),
    }),
  );
  assert.equal(cliente.chamadas.length, 1);
});

test("valida ausência ou configuração inválida da chave sem expor valor", () => {
  assert.equal(configuracaoOpenAiSchema.safeParse({}).success, false);
  assert.equal(
    configuracaoOpenAiSchema.safeParse({ OPENAI_API_KEY: "   " }).success,
    false,
  );
  const segredo = "segredo-de-teste-que-nao-pode-vazar";
  const configuracao = configuracaoOpenAiSchema.safeParse({
    OPENAI_API_KEY: segredo,
  });
  assert.equal(configuracao.success, true);
  assert.doesNotMatch(JSON.stringify(configuracao.success), /segredo-de-teste/);
});

test("requisição e metadados não contêm chave ou raciocínio interno", async () => {
  const cliente = new ClienteResponsesTeste();
  cliente.fila.push(resposta());
  const resultado = await criarComponente(cliente).processar({
    contexto: contextoTeste(),
    execucaoId: randomUUID(),
  });
  const serializado = JSON.stringify({
    chamada: cliente.chamadas[0],
    metadados: resultado.metadados,
  });
  assert.doesNotMatch(serializado, /OPENAI_API_KEY|segredo-de-teste/);
  assert.doesNotMatch(serializado, /chain.of.thought|raciocínio interno/i);
});

test("executa ferramenta autorizada e continua o ciclo até a resposta final", async () => {
  const cliente = new ClienteResponsesTeste();
  cliente.fila.push(
    {
      ...resposta(),
      output: [
        {
          arguments: '{"slug":"produto-publicado"}',
          call_id: "call_publica_1",
          name: "consultar_produto_publico",
          type: "function_call",
        },
      ],
      output_text: "",
    },
    resposta({ resposta: "O produto publicado foi confirmado." }),
  );
  const execucoes: Array<Record<string, unknown>> = [];
  const executor: ExecutorFerramentasPublicas = {
    async executar(dados) {
      execucoes.push(dados);
      return {
        consultado_em: "2026-07-30T12:00:00.000Z",
        dados: { nome: "Produto publicado" },
        fonte: "catalogo_loja",
        status: "encontrado",
      };
    },
  };

  const resultado = await criarComponente(cliente, {}, executor).processar({
    contexto: contextoTeste(),
    execucaoId: "execucao-correta",
  });

  assert.equal(resultado.tipo, "encaminhar_geracao_resposta");
  assert.equal(execucoes.length, 1);
  assert.equal(execucoes[0]?.execucaoId, "execucao-correta");
  assert.equal(execucoes[0]?.nome, "consultar_produto_publico");
  assert.equal(cliente.chamadas.length, 2);
  assert.ok(Array.isArray(cliente.chamadas[1]?.input));
  const continuacao = JSON.stringify(cliente.chamadas[1]?.input);
  assert.match(continuacao, /function_call_output/);
  assert.match(continuacao, /catalogo_loja/);
  assert.doesNotMatch(continuacao, /OPENAI_API_KEY/);
});

test("interrompe ciclo que excede o limite de chamadas de ferramenta", async () => {
  const cliente = new ClienteResponsesTeste();
  cliente.fila.push({
    ...resposta(),
    output: Array.from({ length: 7 }, (_, indice) => ({
      arguments: '{"slug":"produto-publicado"}',
      call_id: `call_excedente_${indice}`,
      name: "consultar_produto_publico",
      type: "function_call",
    })),
    output_text: "",
  });
  let execucoes = 0;

  await assert.rejects(
    criarComponente(
      cliente,
      {},
      {
        async executar() {
          execucoes += 1;
          return {
            consultado_em: "2026-07-30T12:00:00.000Z",
            dados: null,
            fonte: "catalogo_loja",
            status: "nenhum_resultado",
          };
        },
      },
    ).processar({
      contexto: contextoTeste(),
      execucaoId: "execucao-limite",
    }),
    (erro) =>
      erro instanceof FalhaComponenteOrquestrado &&
      erro.classificacao === "definitiva",
  );
  assert.equal(execucoes, 0);
});
