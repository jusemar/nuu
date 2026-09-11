import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { IndicadorPontosProduto } from "./indicador-pontos-produto";

test("card exibe o texto compacto de pontos", () => {
  const html = renderToStaticMarkup(
    <IndicadorPontosProduto pontos="120.0000" />,
  );

  assert.match(html, /Ganhe 120 pts/);
});

test("PDP exibe o texto completo próximo da compra", () => {
  const html = renderToStaticMarkup(
    <IndicadorPontosProduto pontos="120.0000" contexto="pdp" />,
  );

  assert.match(html, /Ganhe 120 pontos nesta compra/);
});

test("não deixa marcador visual quando não há pontuação elegível", () => {
  assert.equal(
    renderToStaticMarkup(<IndicadorPontosProduto pontos={null} />),
    "",
  );
});
