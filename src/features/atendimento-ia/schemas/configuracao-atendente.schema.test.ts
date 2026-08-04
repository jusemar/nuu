import assert from "node:assert/strict";
import test from "node:test";

import {
  ARMAZENAR_RESPOSTAS_NA_OPENAI,
  MODELO_ESCALONAMENTO_ATENDENTE_IA,
  MODELO_PRINCIPAL_ATENDENTE_IA,
} from "../constants/configuracao-atendente";
import { configuracaoAtendenteIaAmbienteSchema } from "./configuracao-atendente.schema";

test("mantém todos os recursos desativados quando não há configuração", () => {
  const configuracao = configuracaoAtendenteIaAmbienteSchema.parse({});

  assert.deepEqual(configuracao, {
    ATENDENTE_IA_ATIVO: false,
    ATENDENTE_IA_FERRAMENTAS_ATIVAS: false,
    ATENDENTE_IA_MEMORIA_ATIVA: false,
    ATENDENTE_IA_ESCALONAMENTO_ATIVO: false,
    ATENDENTE_IA_RAG_ATIVO: false,
    ATENDENTE_IA_ACOES_ATIVAS: false,
      ATENDENTE_IA_RECURSOS_EXPERIMENTAIS_ATIVOS: false,
      ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS: false,
  });
});

test("aceita somente flags booleanas explícitas", () => {
  const configuracao = configuracaoAtendenteIaAmbienteSchema.parse({
    ATENDENTE_IA_ATIVO: "true",
    ATENDENTE_IA_FERRAMENTAS_ATIVAS: "false",
  });

  assert.equal(configuracao.ATENDENTE_IA_ATIVO, true);
  assert.equal(configuracao.ATENDENTE_IA_FERRAMENTAS_ATIVAS, false);
  assert.throws(() =>
    configuracaoAtendenteIaAmbienteSchema.parse({
      ATENDENTE_IA_ATIVO: "1",
    }),
  );
});

test("materializa as decisões fixas de modelo e armazenamento", () => {
  assert.equal(MODELO_PRINCIPAL_ATENDENTE_IA, "gpt-5.6-terra");
  assert.equal(MODELO_ESCALONAMENTO_ATENDENTE_IA, "gpt-5.6-sol");
  assert.equal(ARMAZENAR_RESPOSTAS_NA_OPENAI, false);
});
