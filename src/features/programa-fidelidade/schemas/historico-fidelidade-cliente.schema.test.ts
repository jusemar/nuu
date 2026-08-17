import assert from "node:assert/strict";
import test from "node:test";

import { historicoFidelidadeClienteSchema } from "./historico-fidelidade-cliente.schema";

test("usa 20 movimentações por página como padrão", () => {
  assert.deepEqual(historicoFidelidadeClienteSchema.parse({}), {
    pagina: 1,
    porPagina: 20,
  });
});

test("aceita somente as quantidades de página previstas", () => {
  for (const porPagina of [10, 20, 30, 50]) {
    assert.equal(
      historicoFidelidadeClienteSchema.parse({ porPagina }).porPagina,
      porPagina,
    );
  }

  assert.equal(
    historicoFidelidadeClienteSchema.parse({ porPagina: 100 }).porPagina,
    20,
  );
});

test("normaliza páginas inválidas para a primeira página", () => {
  assert.equal(historicoFidelidadeClienteSchema.parse({ pagina: -1 }).pagina, 1);
  assert.equal(
    historicoFidelidadeClienteSchema.parse({ pagina: "inválida" }).pagina,
    1,
  );
});
