import assert from "node:assert/strict";
import test from "node:test";

import { resolverRegistroGeograficoEntregaPropria } from "./resolver-hierarquia-entrega-propria";

const ids = { cepId: 4, bairroId: 3, regiaoId: 2, cidadeId: 1 };

test("resolve CEP antes de bairro, região e cidade", () => {
  const resultado = resolverRegistroGeograficoEntregaPropria(
    [
      { tipoDestino: "cidade" as const, cidadeId: 1, valor: "cidade" },
      { tipoDestino: "regiao" as const, regiaoId: 2, valor: "região" },
      { tipoDestino: "bairro" as const, bairroId: 3, valor: "bairro" },
      { tipoDestino: "cep" as const, cepEspecificoId: 4, valor: "cep" },
    ],
    ids,
  );

  assert.equal(resultado?.nivel, "cep");
  assert.equal(resultado?.registro.valor, "cep");
});

test("herda bairro, região e cidade quando níveis mais específicos não existem", () => {
  assert.equal(
    resolverRegistroGeograficoEntregaPropria(
      [{ tipoDestino: "bairro", bairroId: 3, valor: "bairro" }],
      ids,
    )?.nivel,
    "bairro",
  );
  assert.equal(
    resolverRegistroGeograficoEntregaPropria(
      [{ tipoDestino: "regiao", regiaoId: 2, valor: "região" }],
      ids,
    )?.nivel,
    "regiao",
  );
  assert.equal(
    resolverRegistroGeograficoEntregaPropria(
      [{ tipoDestino: "cidade", cidadeId: 1, valor: "cidade" }],
      ids,
    )?.nivel,
    "cidade",
  );
});

test("não usa registro de outra geografia", () => {
  const resultado = resolverRegistroGeograficoEntregaPropria(
    [{ tipoDestino: "cidade", cidadeId: 99 }],
    ids,
  );
  assert.equal(resultado, null);
});
