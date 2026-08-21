import assert from "node:assert/strict";
import test from "node:test";

import robots from "./robots";

test("robots permite todos os crawlers e aponta para o sitemap absoluto", () => {
  const resultado = robots();

  assert.deepEqual(resultado.rules, { userAgent: "*", allow: "/" });
  assert.equal(typeof resultado.sitemap, "string");
  assert.match(String(resultado.sitemap), /^https?:\/\/.*\/sitemap\.xml$/);
});
