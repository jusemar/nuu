import assert from "node:assert/strict";
import test from "node:test";

import { normalizarEstoqueProdutoSimples } from "./normalizar-estoque-produto-simples";

test("aceita estoque zero e inteiros positivos", () => {
  assert.equal(normalizarEstoqueProdutoSimples(0), 0);
  assert.equal(normalizarEstoqueProdutoSimples("12"), 12);
});

test("rejeita estoque negativo, fracionado e inválido", () => {
  assert.equal(normalizarEstoqueProdutoSimples(-1), null);
  assert.equal(normalizarEstoqueProdutoSimples(1.5), null);
  assert.equal(normalizarEstoqueProdutoSimples("abc"), null);
});
