import assert from "node:assert/strict";
import test from "node:test";

import { montarRotuloTrocaPontos } from "./rotulo-troca-pontos";

test("visitante vê o item de troca sem saldo", () => {
  assert.equal(montarRotuloTrocaPontos(null), "Troque seus pontos");
  assert.equal(montarRotuloTrocaPontos(undefined), "Troque seus pontos");
});

test("cliente autenticado vê somente os pontos disponíveis formatados", () => {
  assert.equal(montarRotuloTrocaPontos(2500), "Troque seus pontos · 2.500 pts");
  assert.equal(montarRotuloTrocaPontos(0), "Troque seus pontos · 0 pts");
});
