import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CAPACIDADES_BASE_POR_PAPEL_ADMIN } from "../../../constants/admin/capacidades";
import { RETENCAO_ADMIN } from "../../../constants/admin/retencao";
import { VERSAO_RUBRICA_AVALIACAO_ADMIN } from "../../../constants/admin/rubricas";
import { registrarAvaliacaoRespostaAdminSchema } from "../../../schemas/admin/avaliacao.schema";
import { criarPropostaMelhoriaPersistidaSchema } from "../../../schemas/admin/revisao-operacoes.schema";
import { calcularExpiracaoRevisao } from "./politica-retencao-revisoes";
import { validarTransicaoProposta } from "./politica-transicao-proposta";
import {
  podeAutorDecidir,
  validarTransicaoRevisao,
} from "./politica-transicao-revisao";
import { prepararEvidenciaSanitizada } from "./preparar-evidencia-sanitizada";

const uuid = "00000000-0000-4000-8000-000000000001";
const avaliacao = {
  classificacaoProblema: "problema_clareza" as const,
  comentario: "A resposta pode explicar melhor a limitação encontrada.",
  conversaId: uuid,
  criterios: [],
  decisao: "precisa_melhorar" as const,
  mensagemId: "00000000-0000-4000-8000-000000000002",
  nota: 3,
  respostaCorrigida:
    "Não consigo confirmar agora; preciso consultar a fonte real da loja.",
  versaoRubrica: VERSAO_RUBRICA_AVALIACAO_ADMIN,
};

test("avaliação valida nota, resultado, classificação e limites", () => {
  assert.equal(
    registrarAvaliacaoRespostaAdminSchema.safeParse(avaliacao).success,
    true,
  );
  assert.equal(
    registrarAvaliacaoRespostaAdminSchema.safeParse({ ...avaliacao, nota: 0 })
      .success,
    false,
  );
  assert.equal(
    registrarAvaliacaoRespostaAdminSchema.safeParse({ ...avaliacao, nota: 6 })
      .success,
    false,
  );
  assert.equal(
    registrarAvaliacaoRespostaAdminSchema.safeParse({
      ...avaliacao,
      decisao: "publicada",
    }).success,
    false,
  );
  assert.equal(
    registrarAvaliacaoRespostaAdminSchema.safeParse({
      ...avaliacao,
      classificacaoProblema: "inventada",
    }).success,
    false,
  );
  assert.equal(
    registrarAvaliacaoRespostaAdminSchema.safeParse({
      ...avaliacao,
      comentario: "x".repeat(2_001),
    }).success,
    false,
  );
  assert.equal(
    registrarAvaliacaoRespostaAdminSchema.safeParse({
      ...avaliacao,
      respostaCorrigida: "x".repeat(8_001),
    }).success,
    false,
  );
});

test("proposta usa contrato definitivo sem estado confiado ao cliente", () => {
  assert.equal(
    criarPropostaMelhoriaPersistidaSchema.safeParse({
      categoria: "conhecimento",
      criterioAceite: "A resposta deve usar somente fonte publicada.",
      descricao: "Corrigir a lacuna identificada durante a revisão sanitizada.",
      impacto: "medio",
      prioridade: "media",
      risco: "baixo",
      titulo: "Corrigir lacuna recorrente",
    }).success,
    true,
  );
  assert.equal(
    criarPropostaMelhoriaPersistidaSchema.safeParse({
      categoria: "conhecimento",
      criterioAceite: "A resposta deve usar somente fonte publicada.",
      descricao: "Corrigir a lacuna identificada durante a revisão sanitizada.",
      estado: "concluida",
      impacto: "medio",
      prioridade: "media",
      risco: "baixo",
      titulo: "Corrigir lacuna recorrente",
    }).success,
    false,
  );
});

test("transições encerradas não se repetem e caminhos inválidos são bloqueados", () => {
  assert.doesNotThrow(() => validarTransicaoProposta("aberta", "em_triagem"));
  assert.throws(() => validarTransicaoProposta("aberta", "concluida"));
  assert.throws(() => validarTransicaoProposta("concluida", "concluida"));
  assert.doesNotThrow(() => validarTransicaoRevisao("pendente", "em_analise"));
  assert.doesNotThrow(() => validarTransicaoRevisao("em_analise", "aprovada"));
  assert.throws(() => validarTransicaoRevisao("aprovada", "aprovada"));
});

test("autoaprovação segue quantidade de outros decisores ativos", () => {
  assert.equal(
    podeAutorDecidir({
      autorId: "gestor-a",
      decisorId: "gestor-a",
      outrosDecisoresAtivos: 0,
    }),
    true,
  );
  assert.equal(
    podeAutorDecidir({
      autorId: "gestor-a",
      decisorId: "gestor-a",
      outrosDecisoresAtivos: 1,
    }),
    false,
  );
  assert.equal(
    podeAutorDecidir({
      autorId: "revisor-a",
      decisorId: "gestor-a",
      outrosDecisoresAtivos: 2,
    }),
    true,
  );
});

test("evidência remove dados pessoais e campos internos", () => {
  const resultado = prepararEvidenciaSanitizada(
    "Email cliente@exemplo.com, CPF 123.456.789-00, sessão abc, prompt interno e token sk-secreto",
  );
  assert.equal(resultado.includes("cliente@exemplo.com"), false);
  assert.equal(resultado.includes("123.456.789-00"), false);
  assert.equal(resultado.toLowerCase().includes("prompt"), false);
  assert.equal(resultado.toLowerCase().includes("token"), false);
});

test("permissões impedem escrita do visualizador e publicação do revisor", () => {
  assert.equal(
    CAPACIDADES_BASE_POR_PAPEL_ADMIN.visualizador.includes(
      "avaliacoes_escrita" as never,
    ),
    false,
  );
  assert.equal(
    CAPACIDADES_BASE_POR_PAPEL_ADMIN.visualizador.includes(
      "propostas_escrita" as never,
    ),
    false,
  );
  assert.equal(
    CAPACIDADES_BASE_POR_PAPEL_ADMIN.revisor.includes(
      "publicacoes_escrita" as never,
    ),
    false,
  );
  assert.equal(
    CAPACIDADES_BASE_POR_PAPEL_ADMIN.gestor_principal.includes(
      "revisoes_decisao",
    ),
    true,
  );
});

test("retenção representa 24 meses sem executar exclusão", () => {
  assert.equal(RETENCAO_ADMIN.avaliacoes.dias, 720);
  assert.equal(RETENCAO_ADMIN.propostas.dias, 720);
  assert.equal(
    calcularExpiracaoRevisao(new Date("2026-01-01T00:00:00Z")).toISOString(),
    "2027-12-22T00:00:00.000Z",
  );
});

test("actions auditam e não alteram mensagens, conhecimentos ou RAG", () => {
  const nomes = [
    "avaliar-resposta.ts",
    "criar-proposta-melhoria.ts",
    "atualizar-proposta-melhoria.ts",
    "vincular-evidencia-proposta.ts",
    "converter-proposta-em-caso-teste.ts",
    "iniciar-revisao.ts",
    "decidir-revisao.ts",
  ];
  for (const nome of nomes) {
    const fonte = readFileSync(
      new URL(`../../../actions/revisao/${nome}`, import.meta.url),
      "utf8",
    );
    assert.match(fonte, /exigirCapacidadeAtendimentoIa/);
    assert.match(fonte, /registrarAuditoriaPermissaoAtendimentoIa/);
    assert.doesNotMatch(
      fonte,
      /DocumentosInstitucionais|FragmentosInstitucionais|embedding|publicar/,
    );
    assert.doesNotMatch(fonte, /update\(atendimentoIaMensagensTable\)/);
  }
});

test("migration mantém avaliações antigas e não remove dados", () => {
  const sql = readFileSync(
    new URL(
      "../../../../../../drizzle/0010_brief_roxanne_simpson.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(sql, /atendimento_ia_avaliacao_status/);
  assert.match(sql, /DEFAULT 'registrada' NOT NULL/);
  assert.match(sql, /atendimento_ia_propostas_melhoria/);
  assert.match(sql, /atendimento_ia_proposta_evidencias/);
  assert.match(sql, /atendimento_ia_revisoes/);
  assert.doesNotMatch(sql, /DROP TABLE|DROP COLUMN|DELETE FROM|TRUNCATE/i);
  assert.doesNotMatch(sql, /category_faq/);
});
