import assert from "node:assert/strict";
import test from "node:test";

import {
  calcularDistanciaDoFim,
  decidirRolagemConversa,
  estaProximoDoFim,
} from "./rolagem-conversa";

test("primeiro envio ativa acompanhamento suave", () => {
  assert.deepEqual(
    decidirRolagemConversa({ acompanhando: false, evento: "envio_cliente" }),
    { acompanhar: true, comportamento: "smooth" },
  );
});

test("mensagens consecutivas continuam acompanhadas", () => {
  assert.deepEqual(
    decidirRolagemConversa({
      acompanhando: true,
      evento: "conteudo_atualizado",
    }),
    { acompanhar: true, comportamento: "smooth" },
  );
});

test("resposta da IA acompanha o final quando o cliente já estava nele", () => {
  assert.equal(
    decidirRolagemConversa({
      acompanhando: true,
      evento: "conteudo_atualizado",
    }).comportamento,
    "smooth",
  );
});

test("estado de processamento usa a mesma atualização acompanhada", () => {
  assert.equal(
    decidirRolagemConversa({
      acompanhando: true,
      evento: "conteudo_atualizado",
    }).acompanhar,
    true,
  );
});

test("histórico recuperado é posicionado imediatamente no final", () => {
  assert.deepEqual(
    decidirRolagemConversa({
      acompanhando: false,
      evento: "historico_recuperado",
    }),
    { acompanhar: true, comportamento: "auto" },
  );
});

test("cliente distante do final permanece lendo mensagens antigas", () => {
  assert.deepEqual(
    decidirRolagemConversa({
      acompanhando: true,
      evento: "rolagem_manual",
      proximoDoFim: false,
    }),
    { acompanhar: false, comportamento: null },
  );
});

test("botão de mensagens recentes restaura acompanhamento suave", () => {
  assert.deepEqual(
    decidirRolagemConversa({
      acompanhando: false,
      evento: "ir_para_recentes",
    }),
    { acompanhar: true, comportamento: "smooth" },
  );
});

test("cálculo responsivo depende das dimensões reais do contêiner", () => {
  assert.equal(
    calcularDistanciaDoFim({
      alturaConteudo: 1_200,
      alturaVisivel: 600,
      posicaoVertical: 510,
    }),
    90,
  );
  assert.equal(
    estaProximoDoFim({
      alturaConteudo: 1_200,
      alturaVisivel: 420,
      posicaoVertical: 680,
    }),
    false,
  );
});
