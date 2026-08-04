import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { INSTRUCOES_SISTEMA_ATENDENTE_IA } from "../../../constants/instrucoes-openai";
import {
  publicarConhecimentoSchema,
  publicarLoteConhecimentosSchema,
} from "../../../schemas/admin/publicacao.schema";
import type {
  AlertaPublicacao,
  EntradaElegibilidadePublicacao,
  EvidenciaResultadoLaboratorio,
  TipoCandidatoPublicacao,
} from "../../../types/admin/publicacao";
import { avaliarElegibilidadePublicacao } from "./avaliar-elegibilidade-publicacao";
import { calcularIdentidadeCandidato } from "./calcular-identidade-candidato";
import { montarInstrucoesPublicadas } from "./montar-instrucoes-publicadas";
import {
  calcularHashRequisicaoPublicacao,
  validarRepeticaoPublicacao,
} from "./politica-idempotencia-publicacao";
import { validarEmbeddingsPublicacao } from "./preparar-fragmentos-candidatos";
import { validarPublicacaoNoServidor } from "./validar-publicacao-no-servidor";
const agora = new Date("2026-08-03T12:00:00Z");
const resultado = (
  parcial: Partial<EvidenciaResultadoLaboratorio> = {},
): EvidenciaResultadoLaboratorio => ({
  execucaoId: "e1",
  status: "concluida",
  hashesCongelados: { candidatoConhecimento: "hash-atual" },
  resultado: "aprovado",
  criticidade: "media",
  obrigatorio: true,
  bloqueiaPublicacao: false,
  conflitos: [],
  fontesAusentes: [],
  necessidadeConsultaReal: false,
  violacoes: [],
  casoTesteVersaoId: "caso-1",
  ...parcial,
});
const entrada = (
  tipo: TipoCandidatoPublicacao = "conhecimento",
  parcial: Partial<EntradaElegibilidadePublicacao> = {},
): EntradaElegibilidadePublicacao => ({
  tipo,
  candidatoId: "11111111-1111-4111-8111-111111111111",
  hashAtual: "hash-atual",
  revisao: {
    estado: "aprovada",
    hashAprovado: "hash-atual",
    aprovadorId: "revisor",
    aprovadorTinhaCapacidade: true,
    autorId: "autor",
    outrosDecisoresAtivos: 1,
    revisadoEm: agora,
    atualizadoEm: agora,
  },
  resultados: [resultado()],
  casosObrigatorios: [
    {
      id: "caso-1",
      criticidade: "media",
      obrigatorio: true,
      bloqueiaPublicacao: false,
    },
  ],
  ...parcial,
});
test("conhecimento, FAQ, comportamento e lote podem ser elegíveis", () => {
  for (const tipo of [
    "conhecimento",
    "pergunta_resposta",
    "comportamento",
    "lote",
  ] as const)
    assert.equal(
      avaliarElegibilidadePublicacao(entrada(tipo), agora).elegivel,
      true,
    );
});
test("revisão ausente, reprovada, substituída e aprovador inválido bloqueiam", () => {
  for (const [estado, codigo] of [
    ["ausente", "revisao_obrigatoria_ausente"],
    ["reprovada", "revisao_reprovada"],
    ["substituida", "revisao_obrigatoria_ausente"],
  ] as const)
    assert.ok(
      avaliarElegibilidadePublicacao(
        entrada("conhecimento", { revisao: { ...entrada().revisao, estado } }),
        agora,
      ).bloqueios.includes(codigo),
    );
  assert.ok(
    avaliarElegibilidadePublicacao(
      entrada("conhecimento", {
        revisao: { ...entrada().revisao, aprovadorTinhaCapacidade: false },
      }),
      agora,
    ).bloqueios.includes("aprovador_sem_capacidade"),
  );
  assert.ok(
    avaliarElegibilidadePublicacao(
      entrada("conhecimento", {
        revisao: {
          ...entrada().revisao,
          autorId: "mesmo",
          aprovadorId: "mesmo",
          outrosDecisoresAtivos: 1,
        },
      }),
      agora,
    ).bloqueios.includes("autoaprovacao_proibida"),
  );
});
test("mudança de hash invalida aprovação e laboratório", () => {
  const valor = avaliarElegibilidadePublicacao(
    entrada("conhecimento", { hashAtual: "novo-hash" }),
    agora,
  );
  assert.equal(valor.status, "obsoleto");
  assert.ok(valor.bloqueios.includes("hash_aprovado_divergente"));
  assert.ok(valor.bloqueios.includes("resultado_laboratorio_obsoleto"));
});
test("caso crítico ausente, reprovado, cancelado ou falho bloqueia", () => {
  const obrigatorio = [
    {
      id: "critico",
      criticidade: "critica" as const,
      obrigatorio: true,
      bloqueiaPublicacao: true,
    },
  ];
  const ausente = avaliarElegibilidadePublicacao(
    entrada("conhecimento", { casosObrigatorios: obrigatorio, resultados: [] }),
    agora,
  );
  assert.ok(ausente.bloqueios.includes("caso_critico_obrigatorio_ausente"));
  for (const status of ["cancelada", "falhou"])
    assert.ok(
      avaliarElegibilidadePublicacao(
        entrada("conhecimento", {
          casosObrigatorios: obrigatorio,
          resultados: [
            resultado({
              status,
              casoTesteVersaoId: "critico",
              criticidade: "critica",
            }),
          ],
        }),
        agora,
      ).bloqueios.includes("caso_critico_obrigatorio_ausente"),
    );
  assert.ok(
    avaliarElegibilidadePublicacao(
      entrada("conhecimento", {
        casosObrigatorios: obrigatorio,
        resultados: [
          resultado({
            casoTesteVersaoId: "critico",
            criticidade: "critica",
            resultado: "reprovado",
          }),
        ],
      }),
      agora,
    ).bloqueios.includes("regressao_caso_critico"),
  );
});
test("violações críticas determinísticas não são ocultadas por decisão humana", () => {
  const cenarios: Array<[string, string]> = [
    ["risco de segurança", "risco_seguranca"],
    ["violação de privacidade", "violacao_privacidade"],
    ["dado pessoal exposto", "exposicao_dados_pessoais"],
    [
      "informação institucional incorreta",
      "informacao_institucional_incorreta",
    ],
    ["preço inventado", "preco_inventado"],
    ["estoque inventado", "estoque_inventado"],
    ["promoção inventada", "promocao_inventada"],
    ["política inventada", "politica_inventada"],
    ["uso de ferramenta protegida", "uso_indevido_ferramenta_protegida"],
    ["tentativa de efeito real", "efeito_real_tentado_laboratorio"],
    ["transferência obrigatória ausente", "transferencia_obrigatoria_ausente"],
    ["transferência indevida", "transferencia_indevida_cenario_critico"],
    ["fora do escopo incorreto", "fora_escopo_critico_incorreto"],
  ];
  for (const [violacao, codigo] of cenarios) {
    const valor = avaliarElegibilidadePublicacao(
      entrada("conhecimento", {
        resultados: [
          resultado({ resultado: "aprovado", violacoes: [violacao] }),
        ],
      }),
      agora,
    );
    assert.ok(valor.bloqueios.includes(codigo as never), codigo);
    assert.equal(valor.elegivel, false);
  }
});
test("conflito, fonte ausente e consulta real omitida bloqueiam", () => {
  const valor = avaliarElegibilidadePublicacao(
    entrada("conhecimento", {
      resultados: [
        resultado({
          conflitos: ["fontes"],
          fontesAusentes: ["política"],
          necessidadeConsultaReal: true,
        }),
      ],
    }),
    agora,
  );
  assert.ok(valor.bloqueios.includes("conflito_fontes"));
  assert.ok(valor.bloqueios.includes("fonte_obrigatoria_ausente"));
  assert.ok(valor.bloqueios.includes("consulta_real_obrigatoria_omitida"));
});
test("alertas de tom e concisão não bloqueiam e exigem justificativa futura", () => {
  const alertas: AlertaPublicacao[] = [
    "problema_leve_tom",
    "pequena_perda_concisao",
  ];
  const valor = avaliarElegibilidadePublicacao(
    entrada("comportamento", { alertasDetectados: alertas }),
    agora,
  );
  assert.equal(valor.elegivel, true);
  assert.deepEqual(valor.alertas, alertas.sort());
  assert.equal(valor.exigeJustificativaFutura, true);
});
test("hash de lote é determinístico e muda com qualquer integrante", () => {
  const base = {
    tipo: "lote" as const,
    candidatoId: "11111111-1111-4111-8111-111111111111",
    hashAtual: "lote",
    itensLote: [
      { id: "b", versao: 1, hash: "hb", ordem: 2 },
      { id: "a", versao: 1, hash: "ha", ordem: 1 },
    ],
    comportamentoCandidato: { id: "c", hash: "hc" },
    conjuntoTesteId: "t",
  };
  const a = calcularIdentidadeCandidato(base);
  assert.equal(
    a,
    calcularIdentidadeCandidato({
      ...base,
      itensLote: [...base.itensLote].reverse(),
    }),
  );
  assert.notEqual(
    a,
    calcularIdentidadeCandidato({
      ...base,
      itensLote: base.itensLote.map((i) =>
        i.id === "a" ? { ...i, hash: "alterado" } : i,
      ),
    }),
  );
});
test("elegibilidade pura não publica e integração pública não aceita candidato", async () => {
  const arquivos = [
    "avaliar-elegibilidade-publicacao.ts",
    "validar-resultados-laboratorio.ts",
    "validar-revisoes-publicacao.ts",
  ];
  for (const arquivo of arquivos) {
    const codigo = await readFile(
      new URL(`./${arquivo}`, import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(
      codigo,
      /\.update\(|\.insert\(|publicar|ativarFragmento|orquestrador/i,
    );
  }
  const publico = await readFile(
    new URL(
      "../../../actions/executar-orquestrador-mensagem.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.doesNotMatch(
    publico,
    /versaoCandidata|candidatoId|modoLaboratorio|bypass/,
  );
});

test("publicação rejeita bloqueio crítico e exige justificativa para alerta", () => {
  assert.throws(
    () =>
      validarPublicacaoNoServidor(
        entrada("conhecimento", {
          resultados: [resultado({ violacoes: ["risco de segurança"] })],
        }),
      ),
    /PUBLICACAO_NAO_ELEGIVEL/,
  );
  const comAlerta = entrada("conhecimento", {
    alertasDetectados: ["problema_leve_tom"],
  });
  assert.throws(() => validarPublicacaoNoServidor(comAlerta), /JUSTIFICATIVA/);
  assert.equal(
    validarPublicacaoNoServidor(
      comAlerta,
      "Justificativa administrativa detalhada.",
    ).elegivel,
    true,
  );
});

test("idempotência vincula a chave ao mesmo corpo", () => {
  const hash = calcularHashRequisicaoPublicacao({ candidato: "a" });
  assert.equal(
    validarRepeticaoPublicacao(
      { hashRequisicao: hash, status: "concluida" },
      hash,
    ),
    "concluida",
  );
  assert.throws(
    () =>
      validarRepeticaoPublicacao(
        { hashRequisicao: hash, status: "concluida" },
        "forjado",
      ),
    /REUTILIZADA/,
  );
});

test("embeddings incompletos ou de dimensão incorreta são recusados antes da troca", () => {
  assert.throws(() => validarEmbeddingsPublicacao([], 1, 3), /QUANTIDADE/);
  assert.throws(() => validarEmbeddingsPublicacao([[1, 2]], 1, 3), /DIMENSAO/);
  assert.doesNotThrow(() => validarEmbeddingsPublicacao([[1, 2, 3]], 1, 3));
});

test("contratos de publicação são estritos e não aceitam elegibilidade ou hash do cliente", () => {
  const base = {
    versaoId: "11111111-1111-4111-8111-111111111111",
    chaveIdempotencia: "publicacao:segura:1234",
  };
  assert.equal(publicarConhecimentoSchema.safeParse(base).success, true);
  assert.equal(
    publicarConhecimentoSchema.safeParse({ ...base, elegivel: true }).success,
    false,
  );
  assert.equal(
    publicarConhecimentoSchema.safeParse({ ...base, hash: "forjado" }).success,
    false,
  );
  assert.equal(
    publicarLoteConhecimentosSchema.safeParse({
      execucaoLaboratorioId: base.versaoId,
      chaveIdempotencia: base.chaveIdempotencia,
    }).success,
    true,
  );
});

test("comportamento publicado mantém o núcleo técnico integralmente antes dos blocos editáveis", () => {
  const configuracao = {
    blocosEditaveis: [
      {
        conteudo: "Responder com clareza.",
        identificador: "clareza",
        titulo: "Clareza",
      },
    ],
    exemplosEvitar: ["Pressionar."],
    exemplosPositivos: ["Posso ajudar."],
    parametros: {
      concisao: "equilibrada" as const,
      formalidade: "neutra" as const,
      tratamentoIncerteza: "consultar_fonte" as const,
    },
    cordialidade: 4,
    acolhimento: 4,
    objetividade: 4,
    linguagemSimples: true,
    evitarLinguagemRobotica: true,
    saudacao: "Olá",
    estruturaExplicacao: "Resposta e detalhes",
    perguntas: "Perguntas curtas",
    recomendacoes: "Conforme necessidade",
    complementos: "Sem pressão",
    faltaInformacao: "Consultar fonte real",
    encaminhamentoHumano: "Explicar encaminhamento",
    palavrasPreferidas: ["ajudar"],
    palavrasEvitadas: ["urgente"],
    tratamentoCliente: "Respeitoso",
    regrasHumanizacao: ["Reconhecer dúvida"],
    naoPressionar: true as const,
    naoAutoritaria: true as const,
    naoInventarVantagem: true as const,
    naoManipularUrgencia: true as const,
    consultarDadosReais: true as const,
    restringirAoEscopoLoja: true as const,
    preservarSegurancaPrivacidade: true as const,
    whatsappEditavel: false as const,
    acoesAdministrativasPermitidas: false as const,
  };
  const resultado = montarInstrucoesPublicadas(configuracao);
  assert.equal(
    resultado.instrucoes.startsWith(INSTRUCOES_SISTEMA_ATENDENTE_IA.trim()),
    true,
  );
  assert.match(
    resultado.instrucoes,
    /preço, modalidade, variante, estoque, promoção, entrega/,
  );
  assert.match(resultado.instrucoes, /Clareza: Responder com clareza/);
});

test("migration do Bloco 11 é incremental e não implementa restauração", async () => {
  const sql = await readFile(
    new URL(
      "../../../../../../drizzle/0014_nappy_corsair.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(sql, /atendimento_ia_publicacoes/);
  assert.match(sql, /tipo_execucao/);
  assert.doesNotMatch(sql, /restaur/i);
});
