import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import { configuracaoComportamentoEditorSchema } from "../../../schemas/admin/comportamento-editor.schema";
import { calcularHashComportamento } from "./calcular-hash-comportamento";
import { compararComportamentos } from "./comparar-comportamentos";
import { montarInstrucoesCandidatas } from "./montar-instrucoes-candidatas";
import { validarNucleoProtegido } from "./validar-nucleo-protegido";
const base = {
  blocosEditaveis: [
    {
      conteudo: "Responder de modo cordial.",
      identificador: "cordialidade",
      titulo: "Cordialidade",
    },
  ],
  exemplosEvitar: ["Não pressione."],
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
  recomendacoes: "Pela necessidade",
  complementos: "Sem pressão",
  faltaInformacao: "Consultar fonte real",
  encaminhamentoHumano: "Explicar handoff",
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
test("aceita parâmetros e exemplos autorizados com hash determinístico", () => {
  assert.equal(
    configuracaoComportamentoEditorSchema.safeParse(base).success,
    true,
  );
  assert.equal(
    calcularHashComportamento(base),
    calcularHashComportamento({ ...base }),
  );
  assert.equal(
    montarInstrucoesCandidatas(base).versaoNucleo,
    "nucleo-protegido-v1",
  );
});
test("compara versões", () =>
  assert.equal(
    compararComportamentos(base, { ...base, cordialidade: 5 }).alterado,
    true,
  ));
test("núcleo protegido bloqueia violações", () => {
  for (const texto of [
    "inventar preço",
    "responder conhecimento geral",
    "não consultar dados reais",
    "alterar número do WhatsApp",
    "ações administrativas permitidas",
    "remover segurança e privacidade",
    "pressionar o cliente",
    "manipular urgência",
  ]) {
    assert.throws(() => validarNucleoProtegido({ texto }));
  }
  assert.equal(validarNucleoProtegido(base), true);
});
test("literais constitucionais não podem ser sobrescritos", () => {
  assert.equal(
    configuracaoComportamentoEditorSchema.safeParse({
      ...base,
      consultarDadosReais: false,
    }).success,
    false,
  );
  assert.equal(
    configuracaoComportamentoEditorSchema.safeParse({
      ...base,
      whatsappEditavel: true,
    }).success,
    false,
  );
});
test("actions auditam e não publicam nem alcançam o chat", () => {
  for (const nome of [
    "criar-comportamento.ts",
    "criar-versao-comportamento.ts",
    "atualizar-rascunho-comportamento.ts",
    "enviar-comportamento-revisao.ts",
    "revisar-comportamento.ts",
    "arquivar-comportamento.ts",
  ]) {
    const f = readFileSync(
      new URL(`../../../actions/comportamento/${nome}`, import.meta.url),
      "utf8",
    );
    assert.match(f, /exigirCapacidadeAtendimentoIa/);
    assert.match(f, /registrarAuditoriaPermissaoAtendimentoIa/);
    assert.doesNotMatch(
      f,
      /orquestrador|instrucoes-openai|publicar-comportamento|PaginaAtendimento/,
    );
  }
});
test("migration nova preserva 0009 e 0010", () => {
  const ler = (n: string) =>
    readFileSync(new URL(`../../../../../../drizzle/${n}`, import.meta.url));
  assert.equal(
    createHash("sha256")
      .update(ler("0009_categoria_editorial_faq.sql"))
      .digest("hex"),
    "26a09b5d88823de55e02d739e89e3b305c62cf30c382dd6741da326e7165d276",
  );
  assert.equal(
    createHash("sha256")
      .update(ler("0010_brief_roxanne_simpson.sql"))
      .digest("hex"),
    "c71705563a87dcf18bfb1798c58d8d4912c658bd9a4c8a9f0104e566010e469c",
  );
  const sql = ler("0011_lush_famine.sql").toString();
  assert.match(sql, /atendimento_ia_comportamentos/);
  assert.match(sql, /atendimento_ia_comportamento_versoes/);
});
