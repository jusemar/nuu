import assert from "node:assert/strict";
import test from "node:test";

import { prepararOverridesCategorias } from "./preparar-overrides-categorias";

test("não duplica a taxa global para categoria padrão ativa", () => {
  assert.deepEqual(
    prepararOverridesCategorias([
      {
        categoriaId: "11111111-1111-4111-8111-111111111111",
        personalizada: false,
        pontosPorReal: 2,
        ativa: true,
      },
    ]),
    [],
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

test("preserva desativação mesmo quando a taxa é herdada", () => {
  assert.equal(
    prepararOverridesCategorias([
      {
        categoriaId: "11111111-1111-4111-8111-111111111111",
        personalizada: false,
        pontosPorReal: 1,
        ativa: false,
      },
    ])[0]?.pontosPorReal,
    null,
  );
});
