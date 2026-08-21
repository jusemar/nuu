import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const codigo = readFileSync(
  new URL("./buscar-faqs-publicas-categoria.ts", import.meta.url),
  "utf8",
);

test("FAQ pública restringe categoria e ignora itens inativos", () => {
  assert.match(codigo, /eq\(categoryFaqTable\.categoryId, categoriaId\)/);
  assert.match(codigo, /eq\(categoryFaqTable\.isActive, true\)/);
  assert.doesNotMatch(codigo, /parentId|inArray|descendente/i);
});

test("FAQ pública ordena por índice e usa ID como desempate", () => {
  assert.match(
    codigo,
    /orderBy\(asc\(categoryFaqTable\.orderIndex\), asc\(categoryFaqTable\.id\)\)/,
  );
});

test("FAQ pública projeta somente os campos necessários para renderização", () => {
  assert.match(codigo, /id: categoryFaqTable\.id/);
  assert.match(codigo, /pergunta: categoryFaqTable\.question/);
  assert.match(codigo, /resposta: categoryFaqTable\.answer/);
  assert.doesNotMatch(codigo, /\.select\(\)/);
});
