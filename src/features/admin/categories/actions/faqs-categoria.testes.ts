import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const codigo = readFileSync(
  new URL("./faqs-categoria.ts", import.meta.url),
  "utf8",
);
const query = readFileSync(
  new URL("../queries/faqs/listar-faqs-categoria.ts", import.meta.url),
  "utf8",
);

test("escritas usam os contratos Zod existentes", () => {
  for (const contrato of [
    "criarFaqCategoriaSchema.parse",
    "atualizarFaqCategoriaSchema.parse",
    "alterarStatusFaqCategoriaSchema.parse",
    "reordenarFaqsCategoriaSchema.parse",
  ])
    assert.match(codigo, new RegExp(contrato.replace(".", "\\.")));
});

test("atualização e exclusão isolam FAQ pelo ID e pela categoria", () => {
  assert.ok(
    (codigo.match(/eq\(categoryFaqTable\.categoryId, idCategoria\)/g)?.length ??
      0) >= 3,
  );
  assert.match(codigo, /eq\(categoryFaqTable\.id, idFaq\)/);
});

test("edição parcial preserva campos não enviados", () => {
  assert.match(codigo, /\.set\(\{ \.\.\.entrada, updatedAt: new Date\(\) \}\)/);
  assert.doesNotMatch(codigo, /question:\s*entrada\.question\s*\|\|/);
  assert.doesNotMatch(codigo, /answer:\s*entrada\.answer\s*\|\|/);
});

test("listagem persistida é filtrada e ordenada por categoria", () => {
  assert.match(query, /eq\(categoryFaqTable\.categoryId, id\)/);
  assert.match(query, /asc\(categoryFaqTable\.orderIndex\)/);
  assert.match(query, /asc\(categoryFaqTable\.id\)/);
});

test("reordenação usa uma única escrita condicionada à categoria", () => {
  const trecho = codigo.slice(
    codigo.indexOf("export async function reordenarFaqsCategoria"),
  );
  assert.equal((trecho.match(/\.update\(categoryFaqTable\)/g) ?? []).length, 1);
  assert.match(trecho, /validarEscopoOrdemFaqs/);
  assert.match(trecho, /inArray\(categoryFaqTable\.id, ids\)/);
});
