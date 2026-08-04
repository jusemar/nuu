import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { configuracaoComportamentoEditorSchema } from "../../../schemas/admin/comportamento-editor.schema";
import {
  restaurarVersaoComportamentoSchema,
  restaurarVersaoConhecimentoSchema,
} from "../../../schemas/admin/restauracao.schema";
import { calcularHashComportamento } from "../comportamento/calcular-hash-comportamento";
import { montarInstrucoesCandidatas } from "../comportamento/montar-instrucoes-candidatas";
import { calcularIdentidadeRestauracao } from "./calcular-identidade-restauracao";
import { compararRestauracaoComPublicada } from "./comparar-restauracao-com-publicada";
import { criarCandidatoRestauracao } from "./criar-candidato-restauracao";
import {
  GARANTIAS_RESTAURACAO,
  normalizarJustificativaRestauracao,
} from "./politica-restauracao";
import { validarIdempotenciaRestauracao } from "./validar-idempotencia-restauracao";
import { validarOrigemRestauracao } from "./validar-origem-restauracao";

const raiz = process.cwd();
const ler = (caminho: string) => readFileSync(`${raiz}/${caminho}`, "utf8");
const id = "11111111-1111-4111-8111-111111111111";
const outroId = "22222222-2222-4222-8222-222222222222";
const entrada = {
  chaveIdempotencia: "restauracao-chave-123456",
  justificativa: "Retomar conteúdo institucional validado anteriormente.",
  recursoId: id,
  versaoAtualEsperada: 4,
  versaoOrigemId: outroId,
};

test("contratos exigem justificativa, UUIDs, versão e chave de idempotência", () => {
  assert.equal(restaurarVersaoConhecimentoSchema.parse(entrada).recursoId, id);
  assert.equal(restaurarVersaoComportamentoSchema.parse(entrada).recursoId, id);
  assert.equal(
    restaurarVersaoConhecimentoSchema.safeParse({
      ...entrada,
      justificativa: "curta",
    }).success,
    false,
  );
  assert.equal(
    restaurarVersaoConhecimentoSchema.safeParse({
      ...entrada,
      chaveIdempotencia: "pequena",
    }).success,
    false,
  );
});

test("identidade é determinística e vincula ator, origem, recurso e justificativa", () => {
  const base = {
    atorId: "gestor-1",
    chaveIdempotencia: entrada.chaveIdempotencia,
    justificativaNormalizada: normalizarJustificativaRestauracao(
      entrada.justificativa,
    ),
    recursoId: entrada.recursoId,
    tipo: "conhecimento" as const,
    versaoOrigemId: entrada.versaoOrigemId,
  };
  const identidade = calcularIdentidadeRestauracao(base);
  assert.equal(calcularIdentidadeRestauracao(base), identidade);
  assert.notEqual(
    calcularIdentidadeRestauracao({ ...base, atorId: "gestor-2" }),
    identidade,
  );
  assert.equal(
    validarIdempotenciaRestauracao(
      { identidade, novaVersaoId: id },
      identidade,
    ),
    id,
  );
  assert.throws(
    () =>
      validarIdempotenciaRestauracao(
        { identidade: "outra", novaVersaoId: id },
        identidade,
      ),
    /CHAVE_IDEMPOTENCIA_REUTILIZADA/,
  );
});

test("candidata sempre nasce rascunho sem publicação, laboratório ou indexação", () => {
  const candidata = criarCandidatoRestauracao({
    conteudo: { respostaPrincipal: "Resposta restaurada" },
    hash: "hash-recalculado",
    justificativa: entrada.justificativa,
    proximoNumero: 5,
    versaoAnteriorId: id,
    versaoOrigemId: outroId,
  });
  assert.equal(candidata.estado, "rascunho");
  assert.equal(candidata.restauradaDeVersaoId, outroId);
  assert.equal(candidata.proximoNumero, 5);
  assert.deepEqual(GARANTIAS_RESTAURACAO, {
    ativaFragmentos: false,
    copiaAprovacoes: false,
    copiaLaboratorio: false,
    criaEmbeddings: false,
    estadoInicial: "rascunho",
    publicaAutomaticamente: false,
  });
});

test("origem incorreta ou inexistente é bloqueada sem revelar conteúdo", () => {
  assert.throws(
    () =>
      validarOrigemRestauracao({
        recursoEsperadoId: id,
        recursoOrigemId: outroId,
        versaoOrigemId: outroId,
      }),
    /RECURSO_RESTAURACAO_INCORRETO/,
  );
  assert.throws(
    () =>
      validarOrigemRestauracao({
        recursoEsperadoId: id,
        recursoOrigemId: id,
        versaoOrigemId: null,
      }),
    /VERSAO_HISTORICA_NAO_ENCONTRADA/,
  );
});

test("comparação usa hashes e números sem alterar versões", () => {
  assert.deepEqual(
    compararRestauracaoComPublicada({
      hashHistorico: "a",
      hashPublicado: "b",
      numeroHistorico: 1,
      numeroPublicado: 4,
    }),
    {
      conteudoIdentico: false,
      hashHistorico: "a",
      hashPublicado: "b",
      numeroHistorico: 1,
      numeroPublicado: 4,
    },
  );
});

test("comportamento restaurado usa validação e núcleo protegido atuais", () => {
  const atual = configuracaoComportamentoEditorSchema.parse({
    blocosEditaveis: [],
    exemplosEvitar: [],
    exemplosPositivos: [],
    parametros: {
      concisao: "equilibrada",
      formalidade: "neutra",
      tratamentoIncerteza: "consultar_fonte",
    },
    cordialidade: 4,
    acolhimento: 4,
    objetividade: 4,
    linguagemSimples: true,
    evitarLinguagemRobotica: true,
    saudacao: "Olá",
    estruturaExplicacao: "Resposta e detalhes",
    perguntas: "Pergunte com objetividade",
    recomendacoes: "Recomende pela necessidade",
    complementos: "Sem pressão",
    faltaInformacao: "Consulte a fonte real",
    encaminhamentoHumano: "Transfira quando obrigatório",
    palavrasPreferidas: [],
    palavrasEvitadas: [],
    tratamentoCliente: "Respeitoso",
    regrasHumanizacao: [],
    naoPressionar: true,
    naoAutoritaria: true,
    naoInventarVantagem: true,
    naoManipularUrgencia: true,
    consultarDadosReais: true,
    restringirAoEscopoLoja: true,
    preservarSegurancaPrivacidade: true,
    whatsappEditavel: false,
    acoesAdministrativasPermitidas: false,
  });
  const candidata = montarInstrucoesCandidatas(atual);
  assert.equal(candidata.versaoNucleo, "nucleo-protegido-v1");
  assert.equal(
    calcularHashComportamento(candidata.configuracao),
    calcularHashComportamento(atual),
  );
  assert.throws(() =>
    montarInstrucoesCandidatas({ ...atual, consultarDadosReais: false }),
  );
});

test("actions usam gestor, transação, locks, auditoria e não copiam evidências", () => {
  for (const caminho of [
    "src/features/atendimento-ia/actions/conhecimento/restaurar-versao-conhecimento.ts",
    "src/features/atendimento-ia/actions/comportamento/restaurar-versao-comportamento.ts",
  ]) {
    const fonte = ler(caminho);
    assert.match(fonte, /restauracoes_escrita/);
    assert.match(fonte, /dbTransacional\.transaction/);
    assert.match(fonte, /pg_advisory_xact_lock/);
    assert.match(fonte, /restauradaDeVersaoId/);
    assert.match(fonte, /estado: candidato\.estado/);
    assert.match(fonte, /_solicitada/);
    assert.match(fonte, /_concluida/);
    assert.match(fonte, /_rejeitada/);
    assert.doesNotMatch(fonte, /insert\(atendimentoIaFragmentos/);
    assert.doesNotMatch(fonte, /embedding|OpenAI|publicar[A-Z]/);
    assert.doesNotMatch(fonte, /atendimentoIaRevisoesTable|ResultadosLaboratorio/);
  }
});

test("conhecimento e FAQ preservam conteúdo estruturado e recalculam hash", () => {
  const fonte = ler(
    "src/features/atendimento-ia/actions/conhecimento/restaurar-versao-conhecimento.ts",
  );
  assert.match(fonte, /documento\.tipo/);
  assert.match(fonte, /criarVersaoConhecimentoSchema\.parse/);
  assert.match(fonte, /prepararVersaoConhecimento/);
  assert.match(fonte, /conteudoEstruturado: candidato\.conteudo/);
  assert.match(fonte, /statusIndexacao: "pendente"/);
});

test("interface informa comparação, origem e fluxo editorial completo", () => {
  const fonte = ler(
    "src/features/atendimento-ia/components/admin/conhecimentos/restaurar-versao-historica.tsx",
  );
  assert.match(fonte, /Restaurar como nova versão/);
  assert.match(fonte, /Justificativa obrigatória/);
  assert.match(fonte, /Nenhuma publicação, indexação ou ativação ocorrerá/);
  assert.match(fonte, /revisão, testes,\s+elegibilidade e publicação/);
  assert.doesNotMatch(fonte, /restaurar e publicar|publicar automaticamente/i);
});

test("queries são server-only e cobrem histórico, comparação e cadeia", () => {
  for (const arquivo of [
    "listar-versoes-restauraveis.ts",
    "buscar-versao-historica.ts",
    "comparar-versao-historica-publicada.ts",
    "listar-restauracoes.ts",
    "buscar-cadeia-restauracoes.ts",
  ]) {
    const fonte = ler(
      `src/features/atendimento-ia/queries/admin/restauracao/${arquivo}`,
    );
    assert.match(fonte, /import "server-only"/);
    assert.match(fonte, /conhecimentos_leitura/);
  }
});

test("Bloco 12 não cria migration nem altera integrações públicas", () => {
  const journal = ler("drizzle/meta/_journal.json");
  assert.doesNotMatch(journal, /0015_/);
  const statusPublicacao = process.env.ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS;
  assert.notEqual(statusPublicacao, "true");
});
