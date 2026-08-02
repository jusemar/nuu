import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import type {
  EstadoMensagemAtendimento,
  IdentidadeEntradaAtendimento,
} from "../types/entrada-mensagem";
import {
  type ComponenteProcessamentoOrquestrado,
  type ContextoPersistidoOrquestrador,
  FalhaComponenteOrquestrado,
  type ReivindicacaoOrquestracao,
  type RepositorioOrquestrador,
} from "../types/orquestrador";
import { orquestrarMensagem } from "./orquestrar-mensagem";
import {
  transicaoOrquestradorPermitida,
  validarTransicaoOrquestrador,
} from "./transicoes-orquestrador";

const metadadosModeloTeste = {
  duracaoEmMs: 10,
  modelo: "gpt-5.6-terra" as const,
  motivoEscalonamento: null,
  respostaId: "resp_teste",
  tokensEntrada: 10,
  tokensSaida: 5,
};

type RegistroMensagem = {
  contexto: ContextoPersistidoOrquestrador;
  estado: EstadoMensagemAtendimento;
  identidade: IdentidadeEntradaAtendimento;
};

class RepositorioOrquestradorMemoria implements RepositorioOrquestrador {
  mensagens = new Map<string, RegistroMensagem>();
  reivindicacoes = new Map<
    string,
    { execucaoId: string; status: "processando" | "concluida" | "falhou" }
  >();
  auditorias: string[] = [];
  execucoes = new Map<
    string,
    { estado: "processando" | "falhou"; erro?: string }
  >();
  ocorrencias: string[] = [];
  falharConclusaoDepoisDaAlteracao = false;
  ultimaExecucaoConcluida: {
    execucaoId: string;
    respostaId: string;
  } | null = null;

  async reivindicarProcessamento(dados: {
    identidade: IdentidadeEntradaAtendimento;
    memoriaAtiva: boolean;
    mensagemId: string;
  }): Promise<ReivindicacaoOrquestracao> {
    const registro = this.mensagens.get(dados.mensagemId);
    if (
      !registro ||
      registro.identidade.identificadorSessao !==
        dados.identidade.identificadorSessao ||
      registro.identidade.usuarioId !== dados.identidade.usuarioId
    ) {
      throw new Error("CONVERSA_INDISPONIVEL");
    }

    const reivindicacao = this.reivindicacoes.get(dados.mensagemId);
    if (registro.estado === "concluida") {
      return {
        estado: "concluida",
        execucaoId: reivindicacao?.execucaoId ?? null,
        tipo: "ja_concluida",
      };
    }
    if (
      [
        "aguardando_ferramenta",
        "executando_ferramenta",
        "gerando_resposta",
        "aguardando_atendimento_humano",
      ].includes(registro.estado)
    ) {
      return {
        estado: registro.estado,
        execucaoId: reivindicacao?.execucaoId ?? null,
        tipo: "em_processamento",
      };
    }
    if (registro.estado !== "processando") {
      return { estado: registro.estado, tipo: "estado_incompativel" };
    }
    if (reivindicacao?.status === "processando") {
      return {
        estado: registro.estado,
        execucaoId: reivindicacao.execucaoId,
        tipo: "em_processamento",
      };
    }

    const execucaoId = randomUUID();
    this.reivindicacoes.set(dados.mensagemId, {
      execucaoId,
      status: "processando",
    });
    this.execucoes.set(execucaoId, { estado: "processando" });
    this.auditorias.push("orquestracao_iniciada", "contexto_recuperado");

    return {
      contexto: {
        ...registro.contexto,
        memoriaPermitida: dados.memoriaAtiva
          ? registro.contexto.memoriaPermitida
          : [],
      },
      execucaoId,
      tipo: "adquirida",
    };
  }

  async concluirEncaminhamento(dados: {
    execucaoId: string;
    mensagemId: string;
    proximoEstado:
      | "aguardando_ferramenta"
      | "gerando_resposta"
      | "aguardando_atendimento_humano";
    resultado: import("../types/orquestrador").ResultadoComponenteOrquestrado;
  }) {
    const mensagem = this.mensagens.get(dados.mensagemId);
    const estadoAnterior = mensagem?.estado;
    if (!mensagem || estadoAnterior !== "processando") {
      throw new Error("CONTEXTO_INCONSISTENTE");
    }
    mensagem.estado = dados.proximoEstado;

    if (this.falharConclusaoDepoisDaAlteracao) {
      // Simula o rollback que a implementação Drizzle realiza na transação.
      mensagem.estado = estadoAnterior;
      throw new Error("PERSISTENCIA_INDISPONIVEL");
    }

    this.reivindicacoes.set(dados.mensagemId, {
      execucaoId: dados.execucaoId,
      status: "concluida",
    });
    this.auditorias.push("orquestracao_encaminhada");
    this.ultimaExecucaoConcluida = {
      execucaoId: dados.execucaoId,
      respostaId: dados.resultado.metadados.respostaId,
    };
    return {
      mensagemRespostaId:
        dados.resultado.tipo === "encaminhar_geracao_resposta"
          ? randomUUID()
          : null,
      transferenciaId:
        dados.resultado.tipo === "aguardar_atendimento_humano"
          ? randomUUID()
          : null,
    };
  }

  async registrarFalha(dados: {
    classificacao: "recuperavel" | "definitiva";
    execucaoId: string;
    mensagemId: string;
    tipo: FalhaComponenteOrquestrado["tipo"];
  }) {
    const mensagem = this.mensagens.get(dados.mensagemId);
    if (!mensagem) throw new Error("CONTEXTO_INCONSISTENTE");
    if (dados.classificacao === "definitiva") mensagem.estado = "falhou";
    this.execucoes.set(dados.execucaoId, {
      erro: `${dados.classificacao}:${dados.tipo}`,
      estado: "falhou",
    });
    this.reivindicacoes.set(dados.mensagemId, {
      execucaoId: dados.execucaoId,
      status: "falhou",
    });
    this.ocorrencias.push(dados.tipo);
    this.auditorias.push("orquestracao_falhou");
  }
}

function criarCenario(
  repositorio: RepositorioOrquestradorMemoria,
  opcoes: {
    estado?: EstadoMensagemAtendimento;
    identidade?: IdentidadeEntradaAtendimento;
    usuarioConversa?: string | null;
  } = {},
) {
  const identidade = opcoes.identidade ?? {
    identificadorSessao: randomUUID(),
    usuarioId: opcoes.usuarioConversa ?? "usuario-1",
  };
  const conversaId = randomUUID();
  const mensagemId = randomUUID();
  const contexto: ContextoPersistidoOrquestrador = {
    conversa: {
      canal: "site",
      id: conversaId,
      identificadorSessao: identidade.identificadorSessao,
      status: "ativa",
      usuarioId: identidade.usuarioId,
    },
    estado: {
      estadoEstruturado: { pendencia: "confirmar uso" },
      etapaAtual: "compreensao",
      intencaoAtual: "informacao_produto",
      versao: 2,
    },
    memoriaPermitida: [
      {
        assuntoNormalizado: "preferencia",
        categoria: "preferencia",
        id: randomUUID(),
        origem: "informada_cliente",
        valorEstruturado: { faixa: "declarada" },
      },
    ],
    mensagemAtual: {
      autor: "cliente",
      conteudo: "Mensagem atual",
      criadoEm: new Date("2026-07-30T12:00:00Z"),
      id: mensagemId,
      status: opcoes.estado ?? "processando",
    },
    mensagensAnteriores: [
      {
        autor: "cliente",
        conteudo: "Mensagem anterior da mesma conversa",
        criadoEm: new Date("2026-07-30T11:59:00Z"),
        id: randomUUID(),
        status: "concluida",
      },
    ],
    resumo: {
      ateMensagemId: randomUUID(),
      conteudo: "Resumo previamente persistido",
      resumoEstruturado: { fatoConfirmado: true },
      criadoEm: new Date("2026-07-30T11:59:30Z"),
      hashConteudoConsiderado: "hash-invalido-no-teste-legado",
      quantidadeMensagens: 1,
      versao: 1,
    },
    resultadosFerramentas: [],
  };
  repositorio.mensagens.set(mensagemId, {
    contexto,
    estado: opcoes.estado ?? "processando",
    identidade,
  });
  return { contexto, identidade, mensagemId };
}

test("processamento normal recupera contexto e encaminha a próxima etapa", async () => {
  const repositorio = new RepositorioOrquestradorMemoria();
  const cenario = criarCenario(repositorio);
  let contextoRecebido: ContextoPersistidoOrquestrador | null = null;
  const componente: ComponenteProcessamentoOrquestrado = {
    async processar({ contexto }) {
      contextoRecebido = contexto;
      return {
        conteudoResposta: "Resposta validada",
        metadados: metadadosModeloTeste,
        tipo: "encaminhar_geracao_resposta",
      };
    },
  };

  const resultado = await orquestrarMensagem(
    { componente, memoriaAtiva: true, repositorio },
    { identidade: cenario.identidade, mensagemId: cenario.mensagemId },
  );

  assert.equal(resultado.tipo, "encaminhada");
  assert.equal(resultado.estado, "gerando_resposta");
  assert.deepEqual(contextoRecebido, cenario.contexto);
  assert.equal(
    repositorio.mensagens.get(cenario.mensagemId)?.estado,
    "gerando_resposta",
  );
  assert.deepEqual(repositorio.auditorias, [
    "orquestracao_iniciada",
    "contexto_recuperado",
    "orquestracao_encaminhada",
  ]);
  assert.equal(repositorio.execucoes.size, 1);
  assert.ok(resultado.tipo === "encaminhada" && resultado.mensagemRespostaId);
  assert.deepEqual(repositorio.ultimaExecucaoConcluida, {
    execucaoId: resultado.execucaoId,
    respostaId: "resp_teste",
  });
});

test("não entrega memória quando o recurso está desativado", async () => {
  const repositorio = new RepositorioOrquestradorMemoria();
  const cenario = criarCenario(repositorio);
  let quantidadeMemorias = -1;
  const componente: ComponenteProcessamentoOrquestrado = {
    async processar({ contexto }) {
      quantidadeMemorias = contexto.memoriaPermitida.length;
      return { metadados: metadadosModeloTeste, tipo: "aguardar_ferramenta" };
    },
  };

  await orquestrarMensagem(
    { componente, memoriaAtiva: false, repositorio },
    { identidade: cenario.identidade, mensagemId: cenario.mensagemId },
  );
  assert.equal(quantidadeMemorias, 0);
});

test("rejeita conversa inexistente, outra sessão e outro usuário", async () => {
  const repositorio = new RepositorioOrquestradorMemoria();
  const cenario = criarCenario(repositorio);
  const componente: ComponenteProcessamentoOrquestrado = {
    async processar() {
      return { metadados: metadadosModeloTeste, tipo: "aguardar_ferramenta" };
    },
  };

  await assert.rejects(
    orquestrarMensagem(
      { componente, memoriaAtiva: true, repositorio },
      {
        identidade: identidadeDiferente(cenario.identidade),
        mensagemId: cenario.mensagemId,
      },
    ),
    /CONVERSA_INDISPONIVEL/,
  );
  await assert.rejects(
    orquestrarMensagem(
      { componente, memoriaAtiva: true, repositorio },
      {
        identidade: cenario.identidade,
        mensagemId: randomUUID(),
      },
    ),
    /CONVERSA_INDISPONIVEL/,
  );
});

test("diferencia estado incompatível, processamento e conclusão", async () => {
  const repositorio = new RepositorioOrquestradorMemoria();
  const incompatível = criarCenario(repositorio, { estado: "recebida" });
  const concluida = criarCenario(repositorio, { estado: "concluida" });
  const emGeracao = criarCenario(repositorio, {
    estado: "gerando_resposta",
  });
  const componente: ComponenteProcessamentoOrquestrado = {
    async processar() {
      throw new Error("não deveria executar");
    },
  };

  const resultados = await Promise.all([
    orquestrarMensagem(
      { componente, memoriaAtiva: true, repositorio },
      {
        identidade: incompatível.identidade,
        mensagemId: incompatível.mensagemId,
      },
    ),
    orquestrarMensagem(
      { componente, memoriaAtiva: true, repositorio },
      {
        identidade: concluida.identidade,
        mensagemId: concluida.mensagemId,
      },
    ),
    orquestrarMensagem(
      { componente, memoriaAtiva: true, repositorio },
      {
        identidade: emGeracao.identidade,
        mensagemId: emGeracao.mensagemId,
      },
    ),
  ]);

  assert.equal(resultados[0].tipo, "estado_incompativel");
  assert.equal(resultados[1].tipo, "ja_concluida");
  assert.equal(resultados[2].tipo, "em_processamento");
});

test("concorrência permite somente um processamento", async () => {
  const repositorio = new RepositorioOrquestradorMemoria();
  const cenario = criarCenario(repositorio);
  let chamadas = 0;
  let liberar!: () => void;
  const bloqueio = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  const componente: ComponenteProcessamentoOrquestrado = {
    async processar() {
      chamadas += 1;
      await bloqueio;
      return { metadados: metadadosModeloTeste, tipo: "aguardar_ferramenta" };
    },
  };

  const primeira = orquestrarMensagem(
    { componente, memoriaAtiva: true, repositorio },
    { identidade: cenario.identidade, mensagemId: cenario.mensagemId },
  );
  const segunda = await orquestrarMensagem(
    { componente, memoriaAtiva: true, repositorio },
    { identidade: cenario.identidade, mensagemId: cenario.mensagemId },
  );
  liberar();
  const resultadoPrimeira = await primeira;

  assert.equal(chamadas, 1);
  assert.equal(segunda.tipo, "em_processamento");
  assert.equal(resultadoPrimeira.tipo, "encaminhada");
});

test("falha recuperável preserva processando e permite nova tentativa", async () => {
  const repositorio = new RepositorioOrquestradorMemoria();
  const cenario = criarCenario(repositorio);
  const falha: ComponenteProcessamentoOrquestrado = {
    async processar() {
      throw new FalhaComponenteOrquestrado(
        "recuperavel",
        "modelo_indisponivel",
      );
    },
  };

  const primeira = await orquestrarMensagem(
    { componente: falha, memoriaAtiva: true, repositorio },
    { identidade: cenario.identidade, mensagemId: cenario.mensagemId },
  );
  const segunda = await orquestrarMensagem(
    {
      componente: {
        async processar() {
          return {
            conteudoResposta: "Resposta validada",
            metadados: metadadosModeloTeste,
            tipo: "encaminhar_geracao_resposta",
          };
        },
      },
      memoriaAtiva: true,
      repositorio,
    },
    { identidade: cenario.identidade, mensagemId: cenario.mensagemId },
  );

  assert.equal(primeira.tipo, "falha_recuperavel");
  assert.equal(primeira.estado, "processando");
  assert.equal(segunda.tipo, "encaminhada");
  assert.equal(repositorio.execucoes.size, 2);
  assert.deepEqual(repositorio.ocorrencias, ["modelo_indisponivel"]);
});

test("falha definitiva encerra mensagem, execução e auditoria", async () => {
  const repositorio = new RepositorioOrquestradorMemoria();
  const cenario = criarCenario(repositorio);
  const resultado = await orquestrarMensagem(
    {
      componente: {
        async processar() {
          throw new FalhaComponenteOrquestrado(
            "definitiva",
            "falta_autorizacao",
          );
        },
      },
      memoriaAtiva: true,
      repositorio,
    },
    { identidade: cenario.identidade, mensagemId: cenario.mensagemId },
  );

  assert.equal(resultado.tipo, "falha_definitiva");
  assert.equal(resultado.estado, "falhou");
  assert.equal(repositorio.mensagens.get(cenario.mensagemId)?.estado, "falhou");
  assert.deepEqual(repositorio.ocorrencias, ["falta_autorizacao"]);
  assert.ok(repositorio.auditorias.includes("orquestracao_falhou"));
});

test("falha de persistência reverte transição antes do encerramento seguro", async () => {
  const repositorio = new RepositorioOrquestradorMemoria();
  const cenario = criarCenario(repositorio);
  repositorio.falharConclusaoDepoisDaAlteracao = true;

  const resultado = await orquestrarMensagem(
    {
      componente: {
        async processar() {
          return {
            conteudoResposta: "Resposta validada",
            metadados: metadadosModeloTeste,
            tipo: "encaminhar_geracao_resposta",
          };
        },
      },
      memoriaAtiva: true,
      repositorio,
    },
    { identidade: cenario.identidade, mensagemId: cenario.mensagemId },
  );

  assert.equal(resultado.tipo, "falha_definitiva");
  assert.equal(repositorio.mensagens.get(cenario.mensagemId)?.estado, "falhou");
  assert.equal(
    repositorio.auditorias.filter(
      (evento) => evento === "orquestracao_encaminhada",
    ).length,
    0,
  );
});

test("valida somente transições aprovadas para o orquestrador", () => {
  assert.equal(
    transicaoOrquestradorPermitida("processando", "gerando_resposta"),
    true,
  );
  assert.equal(
    transicaoOrquestradorPermitida("processando", "aguardando_ferramenta"),
    true,
  );
  assert.equal(
    transicaoOrquestradorPermitida(
      "processando",
      "aguardando_atendimento_humano",
    ),
    true,
  );
  assert.equal(transicaoOrquestradorPermitida("processando", "falhou"), true);
  assert.equal(
    transicaoOrquestradorPermitida("recebida", "gerando_resposta"),
    false,
  );
  assert.throws(
    () => validarTransicaoOrquestrador("concluida", "processando"),
    /TRANSICAO_ORQUESTRADOR_INVALIDA/,
  );
});

function identidadeDiferente(
  identidade: IdentidadeEntradaAtendimento,
): IdentidadeEntradaAtendimento {
  return {
    identificadorSessao: randomUUID(),
    usuarioId: identidade.usuarioId ? "outro-usuario" : null,
  };
}
