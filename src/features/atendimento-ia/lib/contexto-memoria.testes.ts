import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { configuracaoContextoSchema } from "../schemas/configuracao-contexto.schema";
import type { ContextoPersistidoOrquestrador, MensagemContextoOrquestrador } from "../types/orquestrador";
import type { RepositorioResumoContexto } from "../types/resumo";
import {
  calcularHashMensagens,
  decidirResumo,
  estimarTokensSeguro,
  montarContextoControlado,
  resumoEhValido,
} from "./contexto-controlado";
import { manterResumoContexto } from "./manter-resumo-contexto";
import {
  compararMemoria,
  type MemoriaCurtoPrazo,
  memoriaPodeSerUtilizada,
  normalizarAssuntoMemoria,
  removerMemoria,
  renovarMemoriaAposUsoValido,
} from "./memoria-curto-prazo";

function mensagem(conteudo: string, criadoEm: string): MensagemContextoOrquestrador {
  return {
    autor: "cliente",
    conteudo,
    criadoEm: new Date(criadoEm),
    id: randomUUID(),
    status: "concluida",
  };
}

function contexto(anteriores: MensagemContextoOrquestrador[] = []): ContextoPersistidoOrquestrador {
  return {
    conversa: {
      canal: "site",
      id: randomUUID(),
      identificadorSessao: randomUUID(),
      status: "ativa",
      usuarioId: "usuario-1",
    },
    estado: {
      estadoEstruturado: { etapa: "pesquisa" },
      etapaAtual: "pesquisa",
      intencaoAtual: "produto",
      versao: 1,
    },
    memoriaPermitida: [],
    mensagemAtual: {
      ...mensagem("mensagem atual prioritária", "2026-08-01T12:00:00Z"),
      status: "processando",
    },
    mensagensAnteriores: anteriores,
    resultadosFerramentas: [],
    resumo: null,
  };
}

const configuracao = {
  limiteTokens: 8_000,
  limiarAtualizacaoResumoTokens: 4_000,
  limiarPrimeiroResumoTokens: 6_000,
};

test("materializa limites oficiais e permite configuração sem código", () => {
  const padrao = configuracaoContextoSchema.parse({});
  assert.equal(padrao.ATENDENTE_IA_CONTEXTO_MAX_TOKENS, 8_000);
  assert.equal(padrao.ATENDENTE_IA_RESUMO_INICIAL_TOKENS, 6_000);
  assert.equal(padrao.ATENDENTE_IA_RESUMO_ATUALIZACAO_TOKENS, 4_000);
  assert.equal(padrao.ATENDENTE_IA_CONTEXTO_VISITANTE_DIAS, 7);
  assert.equal(padrao.ATENDENTE_IA_CONTEXTO_AUTENTICADO_DIAS, 30);
  assert.equal(padrao.ATENDENTE_IA_MEMORIA_DIAS, 30);
  assert.equal(
    configuracaoContextoSchema.parse({
      ATENDENTE_IA_CONTEXTO_MAX_TOKENS: "9000",
    }).ATENDENTE_IA_CONTEXTO_MAX_TOKENS,
    9_000,
  );
  assert.equal(
    configuracaoContextoSchema.safeParse({
      ATENDENTE_IA_CONTEXTO_MAX_TOKENS: "5000",
      ATENDENTE_IA_RESUMO_INICIAL_TOKENS: "6000",
    }).success,
    false,
  );
});

test("monta contexto cronológico e remove identificadores internos", () => {
  const primeiro = mensagem("primeira", "2026-08-01T10:00:00Z");
  const segundo = mensagem("segunda", "2026-08-01T11:00:00Z");
  const resultado = montarContextoControlado(contexto([primeiro, segundo]), configuracao);
  assert.deepEqual(
    resultado.dados.mensagensAnteriores.map((item) => item.conteudo),
    ["primeira", "segunda"],
  );
  assert.equal(JSON.stringify(resultado.dados).includes(primeiro.id), false);
});

test("preserva a mensagem atual e descarta histórico para respeitar 8.000 tokens", () => {
  const anteriores = Array.from({ length: 5 }, (_, indice) =>
    mensagem("x".repeat(3_000), `2026-08-01T0${indice}:00:00Z`),
  );
  const resultado = montarContextoControlado(contexto(anteriores), configuracao);
  assert.equal(resultado.dados.mensagemAtual.conteudo, "mensagem atual prioritária");
  assert.ok(resultado.tokensEstimados <= 8_000);
  assert.ok(resultado.mensagensDescartadas > 0);
});

test("classifica excesso da própria mensagem atual sem descartá-la", () => {
  const dados = contexto();
  dados.mensagemAtual.conteudo = "a".repeat(9_000);
  const resultado = montarContextoControlado(dados, configuracao);
  assert.ok(resultado.tokensEstimados > 8_000);
  assert.equal(resultado.dados.mensagemAtual.conteudo.length, 9_000);
});

test("inclui resultado de ferramenta sanitizado e vinculado à execução carregada", () => {
  const dados = contexto();
  dados.resultadosFerramentas.push({
    nome: "consultar_produto_publico",
    resultado: { id: "interno", nome: "Produto oficial", token: "token: segredo" },
    versao: "1",
  });
  const resultado = montarContextoControlado(dados, configuracao);
  const serializado = JSON.stringify(resultado.dados.resultadosFerramentas);
  assert.match(serializado, /Produto oficial/);
  assert.doesNotMatch(serializado, /interno/);
  assert.match(serializado, /DADO_RESTRITO/);
});

test("gera primeiro resumo somente ao atingir 6.000 tokens", () => {
  assert.equal(decidirResumo(contexto([mensagem("curta", "2026-08-01T10:00:00Z")]), configuracao).tipo, "nao_gerar");
  assert.equal(decidirResumo(contexto([mensagem("x".repeat(6_200), "2026-08-01T10:00:00Z")]), configuracao).tipo, "gerar");
});

test("atualiza após 4.000 tokens novos e não atualiza sem conteúdo novo", () => {
  const anterior = mensagem("base", "2026-08-01T09:00:00Z");
  const dados = contexto([anterior]);
  dados.resumo = {
    ateMensagemId: anterior.id,
    conteudo: "resumo",
    criadoEm: new Date("2026-08-01T09:30:00Z"),
    hashConteudoConsiderado: calcularHashMensagens([anterior]),
    quantidadeMensagens: 1,
    resumoEstruturado: {},
    versao: 1,
  };
  assert.equal(decidirResumo(dados, configuracao).tipo, "nao_gerar");
  dados.mensagensAnteriores.push(mensagem("x".repeat(4_100), "2026-08-01T10:00:00Z"));
  assert.equal(decidirResumo(dados, configuracao).tipo, "atualizar");
});

test("valida versão, limite abrangido e hash antes de reutilizar resumo", () => {
  const anterior = mensagem("fato", "2026-08-01T10:00:00Z");
  const dados = contexto([anterior]);
  dados.resumo = {
    ateMensagemId: anterior.id,
    conteudo: "fato",
    criadoEm: new Date("2026-08-01T10:30:00Z"),
    hashConteudoConsiderado: calcularHashMensagens([anterior]),
    quantidadeMensagens: 1,
    resumoEstruturado: { fatosConfirmados: ["fato"] },
    versao: 1,
  };
  assert.equal(resumoEhValido(dados), true);
  dados.resumo.hashConteudoConsiderado = "adulterado";
  assert.equal(resumoEhValido(dados), false);
  assert.equal(montarContextoControlado(dados, configuracao).dados.resumo, null);
});

test("falha de geração preserva o último resumo válido", async () => {
  const anterior = mensagem("x".repeat(6_100), "2026-08-01T10:00:00Z");
  const dados = contexto([anterior]);
  let persistiu = false;
  const repositorio: RepositorioResumoContexto = {
    async buscarResumoPorExecucao() {
      return null;
    },
    async persistirResumo() {
      persistiu = true;
      throw new Error("falha");
    },
    async registrarAuditoriaResumo() {},
  };
  const resultado = await manterResumoContexto(
    {
      configuracao,
      gerador: { async gerar() { throw new Error("OpenAI indisponível"); } },
      repositorio,
    },
    { contexto: dados, execucaoId: randomUUID() },
  );
  assert.equal(resultado.resumo, dados.resumo);
  assert.equal(persistiu, false);
});

test("repetição idempotente reutiliza resumo da mesma execução sem nova chamada", async () => {
  const anterior = mensagem("x".repeat(6_100), "2026-08-01T10:00:00Z");
  const dados = contexto([anterior]);
  const existente = {
    ateMensagemId: anterior.id,
    conteudo: "resumo persistido",
    criadoEm: new Date("2026-08-01T10:30:00Z"),
    hashConteudoConsiderado: calcularHashMensagens([anterior]),
    quantidadeMensagens: 1,
    resumoEstruturado: { objetivo: "continuar" },
    versao: 1,
  };
  let chamadas = 0;
  const resultado = await manterResumoContexto(
    {
      configuracao,
      gerador: {
        async gerar() {
          chamadas += 1;
          throw new Error("não deveria chamar");
        },
      },
      repositorio: {
        async buscarResumoPorExecucao() { return existente; },
        async persistirResumo() { throw new Error("não deveria persistir"); },
        async registrarAuditoriaResumo() {},
      },
    },
    { contexto: dados, execucaoId: randomUUID() },
  );
  assert.equal(resultado.resumo, existente);
  assert.equal(chamadas, 0);
});

test("concorrência de versões preserva somente a atualização vencedora", async () => {
  const anterior = mensagem("x".repeat(6_100), "2026-08-01T10:00:00Z");
  const dados = contexto([anterior]);
  let versaoAtual = 0;
  let persistencias = 0;
  const repositorio: RepositorioResumoContexto = {
    async buscarResumoPorExecucao() { return null; },
    async persistirResumo(entrada) {
      if ((entrada.resumoAnteriorVersao ?? 0) !== versaoAtual) {
        throw new Error("CONCORRENCIA");
      }
      versaoAtual += 1;
      persistencias += 1;
      return {
        ateMensagemId: entrada.ateMensagemId,
        conteudo: entrada.conteudo,
        criadoEm: new Date(),
        hashConteudoConsiderado: entrada.hashConteudoConsiderado,
        quantidadeMensagens: entrada.quantidadeMensagens,
        resumoEstruturado: entrada.resumoEstruturado,
        versao: versaoAtual,
      };
    },
    async registrarAuditoriaResumo() {},
  };
  const gerador = {
    async gerar() {
      return {
        conteudo: "resumo",
        duracaoEmMs: 1,
        respostaId: "mock",
        resumoEstruturado: { objetivo: "teste" },
        tokensEntrada: 10,
        tokensSaida: 5,
      };
    },
  };
  const resultados = await Promise.all([
    manterResumoContexto({ configuracao, gerador, repositorio }, { contexto: dados, execucaoId: randomUUID() }),
    manterResumoContexto({ configuracao, gerador, repositorio }, { contexto: dados, execucaoId: randomUUID() }),
  ]);
  assert.equal(persistencias, 1);
  assert.equal(resultados.filter((item) => item.resumo?.versao === 1).length, 1);
});

function memoria(sobrescrever: Partial<MemoriaCurtoPrazo> = {}): MemoriaCurtoPrazo {
  return {
    assuntoNormalizado: "faixa preco",
    autorizacaoAtiva: true,
    categoria: "faixa_preco",
    expiraEm: new Date("2026-09-01T00:00:00Z"),
    necessidadeEncerrada: false,
    origem: "informada_cliente",
    proprietarioId: "usuario-1",
    removidaEm: null,
    restrita: false,
    sensibilidade: "comercial",
    situacao: "ativa",
    ultimaUtilizacaoValidaEm: new Date("2026-08-01T00:00:00Z"),
    valorEstruturado: { maximo: 500 },
    ...sobrescrever,
  };
}

test("memória exige flag, autenticação, proprietário e autorização ativa", () => {
  const agora = new Date("2026-08-02T00:00:00Z");
  assert.equal(memoriaPodeSerUtilizada(memoria(), { agora, memoriaAtiva: true, usuarioId: "usuario-1" }), true);
  assert.equal(memoriaPodeSerUtilizada(memoria(), { agora, memoriaAtiva: false, usuarioId: "usuario-1" }), false);
  assert.equal(memoriaPodeSerUtilizada(memoria(), { agora, memoriaAtiva: true, usuarioId: null }), false);
  assert.equal(memoriaPodeSerUtilizada(memoria(), { agora, memoriaAtiva: true, usuarioId: "outro" }), false);
  assert.equal(memoriaPodeSerUtilizada(memoria({ autorizacaoAtiva: false }), { agora, memoriaAtiva: true, usuarioId: "usuario-1" }), false);
});

test("bloqueia memória expirada, removida, restrita ou contraditória", () => {
  const dados = { agora: new Date("2026-08-02T00:00:00Z"), memoriaAtiva: true, usuarioId: "usuario-1" };
  assert.equal(memoriaPodeSerUtilizada(memoria({ expiraEm: new Date("2026-08-01T00:00:00Z") }), dados), false);
  assert.equal(memoriaPodeSerUtilizada(memoria({ removidaEm: dados.agora }), dados), false);
  assert.equal(memoriaPodeSerUtilizada(memoria({ restrita: true }), dados), false);
  assert.equal(memoriaPodeSerUtilizada(memoria({ situacao: "contraditoria" }), dados), false);
});

test("renova uso válido por 30 dias, exceto necessidade encerrada", () => {
  const agora = new Date("2026-08-02T00:00:00Z");
  assert.equal(renovarMemoriaAposUsoValido(memoria(), { agora, dias: 30 }).expiraEm.toISOString(), "2026-09-01T00:00:00.000Z");
  const encerrada = memoria({ necessidadeEncerrada: true });
  assert.equal(renovarMemoriaAposUsoValido(encerrada, { agora, dias: 30 }), encerrada);
});

test("deduplica, complementa, substitui correção explícita e detecta contradição", () => {
  const existente = memoria();
  const base = { assuntoNormalizado: "faixa preco", categoria: "faixa_preco" as const };
  assert.equal(compararMemoria(existente, { ...base, correcaoExplicita: false, valorEstruturado: { maximo: 500 } }), "duplicada");
  assert.equal(compararMemoria(existente, { ...base, correcaoExplicita: false, valorEstruturado: { minimo: 100 } }), "complementar");
  assert.equal(compararMemoria(existente, { ...base, correcaoExplicita: false, valorEstruturado: { maximo: 600 } }), "contradicao");
  assert.equal(compararMemoria(existente, { ...base, correcaoExplicita: true, valorEstruturado: { maximo: 600 } }), "substituir");
});

test("normaliza chave lógica e permite remoção antecipada", () => {
  assert.equal(normalizarAssuntoMemoria("  Faixa de Preço! "), "faixa de preco");
  const removida = removerMemoria(memoria(), new Date("2026-08-02T00:00:00Z"));
  assert.equal(removida.situacao, "substituida");
  assert.ok(removida.removidaEm);
});

test("estimador é conservador para UTF-8 e não contabiliza menos que bytes", () => {
  const texto = "ação e preferência";
  assert.equal(estimarTokensSeguro(texto), Buffer.byteLength(texto, "utf8"));
});
