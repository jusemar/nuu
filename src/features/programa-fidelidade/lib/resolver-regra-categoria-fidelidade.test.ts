import assert from "node:assert/strict";
import test from "node:test";

import { resolverRegraCategoriaFidelidade } from "./resolver-regra-categoria-fidelidade";

test("categoria sem configuração não participa", () => {
  assert.equal(
    resolverRegraCategoriaFidelidade(undefined, "1.0000").participa,
    false,
  );
});

test("categoria explicitamente desativada não participa", () => {
  assert.equal(
    resolverRegraCategoriaFidelidade(
      { ativa: false, pontosPorReal: null },
      "1.0000",
    ).participa,
    false,
  );
});

test("categoria participante pode usar taxa base global", () => {
  assert.deepEqual(
    resolverRegraCategoriaFidelidade(
      { ativa: true, pontosPorReal: null },
      "1.0000",
    ),
    {
      participa: true,
      origemRegra: "global",
      pontosPorReal: "1.0000",
    },
  );
});

test("categoria participante pode usar taxa personalizada", () => {
  assert.deepEqual(
    resolverRegraCategoriaFidelidade(
      { ativa: true, pontosPorReal: "1.5000" },
      "1.0000",
    ),
    {
      participa: true,
      origemRegra: "personalizada",
      pontosPorReal: "1.5000",
    },
  );
});
