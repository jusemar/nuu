import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ConteudoEditorialCategoria } from "./conteudo-editorial-categoria";

const faq = {
  id: "faq-1",
  pergunta: "Como escolher?",
  resposta: "Consulte as medidas.",
};

function renderizar(descricaoInferior: string | null, faqs = [faq]) {
  return renderToStaticMarkup(
    <ConteudoEditorialCategoria
      descricaoInferior={descricaoInferior}
      faqs={faqs}
    />,
  );
}

test("sem descrição inferior e sem FAQ não gera seção nem espaço reservado", () => {
  assert.equal(renderizar("<p><br></p>", []), "");
});

test("com descrição inferior e sem FAQ renderiza somente a descrição", () => {
  const html = renderizar("<p>Conteúdo inferior</p>", []);
  assert.match(html, /Conteúdo inferior/);
  assert.doesNotMatch(html, /Perguntas frequentes|<details/);
});

test("sem descrição inferior e com FAQ renderiza pergunta e resposta no HTML", () => {
  const html = renderizar(null);
  assert.doesNotMatch(html, /dangerouslySetInnerHTML/);
  assert.match(html, /Perguntas frequentes/);
  assert.match(html, /Como escolher\?/);
  assert.match(html, /Consulte as medidas\./);
  assert.match(html, /<details/);
});

test("com descrição inferior e FAQ preserva a ordem dos dois blocos", () => {
  const html = renderizar("<p>Conteúdo inferior</p>");
  assert.ok(
    html.indexOf("Conteúdo inferior") < html.indexOf("Perguntas frequentes"),
  );
});
