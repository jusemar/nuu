import assert from "node:assert/strict";
import test from "node:test";

import { montarPaginasCompactas } from "./formatar-fidelidade-cliente";

test("mantém paginação compacta no início, meio e fim", () => {
  assert.deepEqual(montarPaginasCompactas(1, 20), [1, 2, 20]);
  assert.deepEqual(montarPaginasCompactas(10, 20), [1, 9, 10, 11, 20]);
  assert.deepEqual(montarPaginasCompactas(20, 20), [1, 19, 20]);
});
