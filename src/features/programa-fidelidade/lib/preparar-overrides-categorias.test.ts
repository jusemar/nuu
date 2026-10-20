import assert from "node:assert/strict";
import test from "node:test";

import { prepararOverridesCategorias } from "./preparar-overrides-categorias";

test("persiste opt-in que usa a taxa base global", () => {
  assert.deepEqual(
    prepararOverridesCategorias([
      {
        categoriaId: "11111111-1111-4111-8111-111111111111",
        personalizada: false,
        pontosPorReal: 2,
        ativa: true,
      },
    ]),
    [
      {
        categoriaId: "11111111-1111-4111-8111-111111111111",
        ativa: true,
        pontosPorReal: null,
      },
    ],
  );
});

test("persiste somente a taxa personalizada necessária", () => {
  assert.deepEqual(
    prepararOverridesCategorias([
      {
        categoriaId: "11111111-1111-4111-8111-111111111111",
        personalizada: true,
        pontosPorReal: 2.5,
        ativa: true,
      },
    ]),
    [
      {
        categoriaId: "11111111-1111-4111-8111-111111111111",
        ativa: true,
        pontosPorReal: "2.5",
      },
    ],
  );
});

test("ausência de override representa categoria não participante", () => {
  assert.deepEqual(
    prepararOverridesCategorias([
      {
        categoriaId: "11111111-1111-4111-8111-111111111111",
        personalizada: false,
        pontosPorReal: 1,
        ativa: false,
      },
    ]),
    [],
  );
});
