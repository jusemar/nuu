import assert from "node:assert/strict";
import test from "node:test";

import {
  ARMAZENAR_RESPOSTAS_NA_OPENAI,
  MODELO_ESCALONAMENTO_ATENDENTE_IA,
  MODELO_PRINCIPAL_ATENDENTE_IA,
} from "../../constants/configuracao-atendente";
import { INSTRUCOES_SISTEMA_ATENDENTE_IA } from "../../constants/instrucoes-openai";
import { entradaMensagemAtendimentoSchema } from "../entrada-mensagem.schema";
import { respostaEstruturadaOpenAiSchema } from "../resposta-openai.schema";

test("baseline mantém respostas da OpenAI fora do armazenamento remoto", () => {
  assert.equal(ARMAZENAR_RESPOSTAS_NA_OPENAI, false);
  assert.equal(MODELO_PRINCIPAL_ATENDENTE_IA, "gpt-5.6-terra");
  assert.equal(MODELO_ESCALONAMENTO_ATENDENTE_IA, "gpt-5.6-sol");
});

test("baseline mantém entrada pública estrita e versionada", () => {
  assert.equal(
    entradaMensagemAtendimentoSchema.safeParse({
      avisoPrivacidadeVersao: "atendente-ia-contexto-v1",
      canal: "site",
      chaveIdempotencia: "550e8400-e29b-41d4-a716-446655440000",
      mensagem: "Preciso consultar um produto.",
    }).success,
    true,
  );
  assert.equal(
    entradaMensagemAtendimentoSchema.safeParse({
      avisoPrivacidadeVersao: "atendente-ia-contexto-v1",
      canal: "admin",
      chaveIdempotencia: "550e8400-e29b-41d4-a716-446655440000",
      mensagem: "Tente usar um canal não autorizado.",
    }).success,
    false,
  );
});

test("baseline mantém decisões estruturadas e transferência explícita", () => {
  assert.equal(
    respostaEstruturadaOpenAiSchema.safeParse({
      criterio_escalonamento: null,
      decisao: {
        encaminhamento: "gerar_resposta",
        resposta: "Posso ajudar com informações da loja.",
        transferencia: null,
      },
    }).success,
    true,
  );
  assert.equal(
    respostaEstruturadaOpenAiSchema.safeParse({
      criterio_escalonamento: null,
      decisao: {
        encaminhamento: "aguardar_atendimento_humano",
        resposta: "Transferência silenciosa não é permitida.",
        transferencia: null,
      },
    }).success,
    false,
  );
});

test("baseline documenta limites de escopo, fontes reais e núcleo protegido", () => {
  assert.match(
    INSTRUCOES_SISTEMA_ATENDENTE_IA,
    /Perguntas fora do assunto da loja/,
  );
  assert.match(
    INSTRUCOES_SISTEMA_ATENDENTE_IA,
    /preço, modalidade, variante, estoque, promoção, entrega ou/,
  );
  assert.match(
    INSTRUCOES_SISTEMA_ATENDENTE_IA,
    /nunca afirme envio, recebimento, atendimento iniciado ou resolução/,
  );
  assert.match(
    INSTRUCOES_SISTEMA_ATENDENTE_IA,
    /O destinatário, a confirmação, o resumo final e o link são validados pelo/,
  );
});
