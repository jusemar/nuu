import assert from "node:assert/strict";
import test from "node:test";

import robots from "./robots";

test("robots permite busca, bloqueia treinamento e aponta para o sitemap", () => {
  const resultado = robots();

  assert.ok(Array.isArray(resultado.rules));
  assert.deepEqual(resultado.rules[0], {
    userAgent: [
      "Googlebot",
      "Googlebot-Image",
      "Bingbot",
      "OAI-SearchBot",
      "Claude-SearchBot",
      "PerplexityBot",
      "Applebot",
    ],
    allow: "/",
  });
  assert.deepEqual(resultado.rules[1], {
    userAgent: ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended"],
    disallow: "/",
  });
  assert.deepEqual(resultado.rules[2], { userAgent: "*", allow: "/" });
  assert.equal(typeof resultado.sitemap, "string");
  assert.match(String(resultado.sitemap), /^https?:\/\/.*\/sitemap\.xml$/);
});
