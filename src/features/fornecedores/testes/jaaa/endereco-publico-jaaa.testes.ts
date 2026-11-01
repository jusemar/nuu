import assert from "node:assert/strict";
import test from "node:test";

import {
  criarEnderecoPublicoJaaa,
  normalizarIdentidadeJaaa,
  ORIGEM_PUBLICA_JAAA,
} from "../../lib/jaaa/endereco-publico-jaaa";
test("referência pública acompanha formato e normalização do contrato local Jaaa", () => {
  assert.equal(
    normalizarIdentidadeJaaa(" @Fernando_Embrater "),
    "fernando_embrater",
  );
  assert.equal(
    criarEnderecoPublicoJaaa(" @Fernando_Embrater "),
    "https://jaaa.com.br/@fernando_embrater",
  );
  assert.equal(normalizarIdentidadeJaaa("a".repeat(30)), "a".repeat(30));
  assert.equal(normalizarIdentidadeJaaa("a".repeat(31)), null);
});
test("URLs, injeção de parâmetros e identidades inválidas não viram destinos", () => {
  for (const entrada of [
    "",
    "ab",
    "1usuario",
    "nome com espaço",
    "@@usuario",
    "javascript:alert(1)",
    "https://malicioso.invalid/@usuario",
    "https://jaaa.com.br.evil.invalid/@usuario",
    "//evil.invalid",
    "usuario?email=privado",
    "usuario#pedido",
    "usuario/../outro",
    "usuario%3fsegredo",
    "usuario@evil.invalid",
    "usuario\nprivado",
  ]) {
    assert.equal(criarEnderecoPublicoJaaa(entrada), null, entrada);
  }
});
test("destinos têm somente a origem controlada e o caminho público sem dados privados", () => {
  for (const entrada of [
    "Fernando_Embrater",
    "beatriz_atendimento",
    "suporte",
  ]) {
    const url = new URL(criarEnderecoPublicoJaaa(entrada)!);
    assert.equal(url.origin, ORIGEM_PUBLICA_JAAA);
    assert.equal(url.search, "");
    assert.equal(url.hash, "");
    assert.equal(url.username, "");
    assert.equal(url.password, "");
    assert.match(url.pathname, /^\/@[a-z][a-z0-9_]{2,29}$/);
  }
});
