import assert from "node:assert/strict";
import test from "node:test";

import {
  categoriaPodeSerIndexada,
  urlCategoriaPossuiParametros,
} from "./politica-indexacao-categoria";

test("qualquer parâmetro torna a URL filtrada", () => {
  assert.equal(urlCategoriaPossuiParametros({}), false);
  assert.equal(urlCategoriaPossuiParametros({ brand: "marca" }), true);
  assert.equal(urlCategoriaPossuiParametros({ arbitrario: "" }), true);
});

test("categoria com produto público pode ser indexada", () => {
  assert.equal(
    categoriaPodeSerIndexada({
      description: null,
      descriptionBottom: null,
      faqs: [],
      temProdutoPublico: true,
    }),
    true,
  );
});

test("categoria vazia sem conteúdo persistido não pode ser indexada", () => {
  assert.equal(
    categoriaPodeSerIndexada({
      description: null,
      descriptionBottom: "<p> </p>",
      faqs: [],
      temProdutoPublico: false,
    }),
    false,
  );
});

test("categoria vazia com conteúdo editorial ou FAQ útil pode ser indexada", () => {
  assert.equal(
    categoriaPodeSerIndexada({
      description: null,
      descriptionBottom: "<p>Guia editorial da categoria</p>",
      faqs: [],
      temProdutoPublico: false,
    }),
    true,
  );
  assert.equal(
    categoriaPodeSerIndexada({
      description: null,
      descriptionBottom: null,
      faqs: [{ question: "Como escolher?", answer: "Compare as opções." }],
      temProdutoPublico: false,
    }),
    true,
  );
});
