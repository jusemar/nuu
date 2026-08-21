import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../../../app/category/[slug]/page.tsx", import.meta.url),
  "utf8",
);

test("página usa um único h1 para o nome da categoria", () => {
  assert.equal((pagina.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((pagina.match(/<\/h1>/g) ?? []).length, 1);
  assert.match(pagina, /<h1[^>]*>[\s\S]*?category\?\.name[\s\S]*?<\/h1>/);
});

test("remove a frase fixa e integra conteúdo persistido depois dos produtos", () => {
  assert.doesNotMatch(pagina, /Confira nossa linha completa/);
  assert.match(pagina, /descricaoInferior=\{category\.descriptionBottom\}/);
  assert.ok(
    pagina.indexOf("<ConteudoEditorialCategoria") >
      pagina.indexOf("productsFiltrados.length"),
  );
});
