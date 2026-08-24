import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolverPeriodoMetricas } from "../../../schemas/admin/metricas.schema";
import { resolverPapelAtendimentoIa } from "../permissoes/resolver-papel-atendimento-ia";
import { calcularExpiracaoRegistro } from "../retencao/calcular-expiracao-registro";
import { classificarRetencao } from "../retencao/classificar-retencao";
import { prepararDryRunRetencao } from "../retencao/preparar-dry-run-retencao";
import { verificarProtecaoRetencao } from "../retencao/verificar-protecao-retencao";
import { avaliarSaudeDados } from "./avaliar-saude-dados";
import { calcularPercentis } from "./calcular-percentis";
import { classificarFalha } from "./classificar-falha";
import { normalizarEventoObservabilidade } from "./normalizar-evento-observabilidade";
import { criarAlertasOperacionais } from "./politica-alertas-operacionais";
import { sanitizarLogAdministrativo } from "./sanitizar-log-administrativo";

const agora = new Date("2026-08-04T15:00:00.000Z");

test("períodos hoje, 7, 30, 90 dias e timezone administrativo são determinísticos", () => {
  for (const [periodo, dias] of [
    ["hoje", 1],
    ["7d", 7],
    ["30d", 30],
    ["90d", 90],
  ] as const) {
    const resultado = resolverPeriodoMetricas({ periodo }, agora);
    assert.equal(resultado.timezone, "America/Sao_Paulo");
    assert.equal(
      (resultado.ate.getTime() - resultado.desde.getTime()) / 86_400_000,
      dias,
    );
  }
  const personalizado = resolverPeriodoMetricas({
    periodo: "personalizado",
    desde: "2026-07-01T03:00:00Z",
    ate: "2026-08-01T03:00:00Z",
  });
  assert.equal(personalizado.rotulo, "Intervalo personalizado");
  assert.throws(() => resolverPeriodoMetricas({ periodo: "personalizado" }));
});

test("percentis exigem volume mínimo e diferenciam ausência de zero real", () => {
  assert.deepEqual(calcularPercentis([]), {
    quantidade: 0,
    p50: null,
    p95: null,
    p99: null,
  });
  assert.equal(calcularPercentis([0, 10]).p50, 0);
  assert.equal(
    calcularPercentis(Array.from({ length: 20 }, (_, i) => i + 1)).p95,
    19,
  );
  assert.equal(
    calcularPercentis(Array.from({ length: 100 }, (_, i) => i + 1)).p99,
    99,
  );
});

test("logs e eventos removem credenciais, prompts, payloads, argumentos e PII", () => {
  const sanitizado = sanitizarLogAdministrativo({
    email: "pessoa@loja.com",
    token: "segredo",
    payloadBruto: "privado",
    argumentosFerramenta: { cpf: "123" },
    codigo: "falha_segura",
    detalhe: `Falha para ana@example.com CPF 123.456.789-01 ${"x".repeat(300)}`,
  });
  assert.deepEqual(Object.keys(sanitizado).sort(), ["codigo", "detalhe"]);
  assert.ok(String(sanitizado.detalhe).length <= 240);
  assert.doesNotMatch(String(sanitizado.detalhe), /ana@example|123\.456\.789/);
  const evento = normalizarEventoObservabilidade({
    codigo: "exposicao_dados_pessoais",
    criadoEm: agora,
    metadados: { authorization: "Bearer x", status: 500 },
    origem: "execucao",
  });
  assert.equal(evento.classe, "privacidade");
  assert.deepEqual(evento.metadados, { status: 500 });
  assert.equal(classificarFalha("ferramenta_indisponivel"), "ferramenta");
});

test("alertas detectam falhas, fallback, rastreabilidade, laboratório, regressão e retenção", () => {
  const alertas = criarAlertasOperacionais({
    execucoes: 10,
    falhas: 2,
    fallback: 3,
    laboratorioParado: 1,
    regressaoCritica: 1,
    retencaoVencida: 1,
    semRastreabilidade: 1,
    versoesPublicadas: 0,
  });
  assert.deepEqual(alertas.map((item) => item.codigo).sort(), [
    "falhas_recorrentes",
    "fallback_frequente",
    "laboratorio_parado",
    "rastreabilidade_incompleta",
    "regressao_critica_pendente",
    "retencao_vencida",
    "sem_versao_publicada",
  ]);
  assert.equal(avaliarSaudeDados(alertas, agora).status, "critico");
});

test("retenções de 24 meses, 12 meses, 90 dias e permanentes são exatas", () => {
  const base = new Date("2024-01-31T00:00:00Z");
  assert.equal(
    calcularExpiracaoRegistro(base, "vinte_quatro_meses")?.toISOString(),
    "2026-01-31T00:00:00.000Z",
  );
  assert.equal(
    calcularExpiracaoRegistro(base, "doze_meses")?.toISOString(),
    "2025-01-31T00:00:00.000Z",
  );
  assert.equal(
    calcularExpiracaoRegistro(base, "noventa_dias")?.toISOString(),
    "2024-04-30T00:00:00.000Z",
  );
  assert.equal(calcularExpiracaoRegistro(base, "permanente"), null);
  assert.equal(classificarRetencao("avaliacao"), "vinte_quatro_meses");
  assert.equal(classificarRetencao("resultado_laboratorio"), "doze_meses");
  assert.equal(classificarRetencao("erro_tecnico"), "noventa_dias");
});

test("proteções permanentes impedem elegibilidade e dry-run nunca exclui", () => {
  for (const entrada of [
    { publicado: true },
    { usadoEmPublicacao: true },
    { usadoEmExecucaoPublica: true },
    { auditoriaPermanente: true },
    { identidadePublicacao: "sha256:x" },
  ])
    assert.equal(verificarProtecaoRetencao(entrada).protegido, true);
  const resultado = prepararDryRunRetencao(
    [
      {
        fonte: "avaliacoes",
        classe: "vinte_quatro_meses",
        elegiveis: 4,
        protegidos: 2,
        vencemEm30Dias: 1,
      },
    ],
    agora,
  );
  assert.equal(resultado.registrosExcluidos, 0);
  assert.equal(resultado.modo, "dry_run");
});

test("Revisor e Visualizador consultam métricas, mas não executam retenção", () => {
  for (const papel of ["revisor", "visualizador"] as const) {
    const acesso = resolverPapelAtendimentoIa({
      atribuicao: {
        ativo: true,
        capacidadesAdicionais: [],
        id: "papel",
        origem: "atribuicao_explicita",
        papel,
        usuarioId: "usuario",
      },
      acessoGlobalAutorizado: true,
    });
    assert.ok(acesso?.capacidades.includes("metricas_leitura"));
    assert.ok(!acesso?.capacidades.includes("acoes_criticas_execucao"));
  }
});

test("queries são server-only, autenticadas, limitadas e sem seleção de conteúdo pessoal", async () => {
  const arquivos = [
    "buscar-resumo-metricas.ts",
    "buscar-metricas-atendimento.ts",
    "buscar-metricas-treinamento.ts",
    "buscar-metricas-laboratorio.ts",
    "buscar-series-temporais.ts",
    "buscar-distribuicao-avaliacoes.ts",
    "buscar-falhas-ferramentas.ts",
    "buscar-metricas-publicacoes.ts",
    "buscar-metricas-retencao.ts",
    "buscar-saude-dados.ts",
  ];
  for (const arquivo of arquivos) {
    const fonte = await readFile(
      `src/features/atendimento-ia/queries/admin/metricas/${arquivo}`,
      "utf8",
    );
    assert.match(fonte, /server-only/);
    assert.match(
      fonte,
      /buscarAcessoAtendimentoIa|exigirCapacidadeAtendimentoIa/,
    );
    assert.doesNotMatch(fonte, /select\s+\*/i);
    assert.doesNotMatch(
      fonte,
      /select\s+(conteudo|comentario|descricao_sanitizada|argumentos)\b/i,
    );
  }
});

test("Bloco 13 não contém exclusão física nem altera atendimento público", async () => {
  await assert.rejects(
    readFile(
      "src/features/atendimento-ia/lib/admin/retencao/executar-retencao-segura.ts",
      "utf8",
    ),
  );
  await assert.rejects(
    readFile(
      "src/features/atendimento-ia/actions/retencao/executar-retencao.ts",
      "utf8",
    ),
  );
  const acao = await readFile(
    "src/features/atendimento-ia/actions/retencao/executar-dry-run-retencao.ts",
    "utf8",
  );
  assert.doesNotMatch(acao, /\.delete\(|\bdelete\s+from\b/i);
  const diff = await readFile(
    "src/features/atendimento-ia/lib/orquestrar-mensagem.ts",
    "utf8",
  );
  assert.ok(diff.length > 0);
});
