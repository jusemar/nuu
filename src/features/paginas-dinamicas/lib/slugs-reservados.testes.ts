import assert from "node:assert/strict";
import test from "node:test";

import { slugPaginaEhReservado } from "./slugs-reservados";

test("protege segmentos ocupados por rotas reais", () => {
  for (const slug of [
    "admin",
    "api",
    "product",
    "category",
    "cart",
    "checkout",
  ]) {
    assert.equal(slugPaginaEhReservado(slug), true);
  }
  assert.equal(slugPaginaEhReservado("sobre-nos"), false);
});
