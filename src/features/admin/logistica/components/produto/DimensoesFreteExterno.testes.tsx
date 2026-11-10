import assert from "node:assert/strict";
import { describe, it } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { DimensoesFreteExterno } from "./DimensoesFreteExterno";

describe("dimensões para frete externo", () => {
  it("mostra campos editáveis em kg e cm", () => {
    const html = renderToStaticMarkup(
      <DimensoesFreteExterno
        dimensoes={{
          pesoEmKg: "30",
          alturaEmCm: "40",
          larguraEmCm: "50",
          comprimentoEmCm: "100",
        }}
      />,
    );

    assert.equal(html.includes("Peso e dimensões do produto"), true);
    assert.equal(
      html.includes("Usados para cálculo de frete e validação logística."),
      true,
    );
    assert.equal(html.includes("Ajuda: Peso e dimensões"), true);
    assert.equal(html.includes("Peso (kg)"), true);
    assert.equal(html.includes("Altura (cm)"), true);
    assert.equal(html.includes('type="number"'), true);
    assert.equal(html.includes('name="pesoEmKg"'), true);
    assert.equal(html.includes('value="30"'), true);
  });

  it("permite cadastrar dimensões vazias sem resumo visual", () => {
    const html = renderToStaticMarkup(<DimensoesFreteExterno dimensoes={{}} />);

    assert.equal(html.includes('name="comprimentoEmCm"'), true);
    assert.equal(html.includes("Não informado"), false);
    assert.equal(html.includes("sm:grid-cols-2"), true);
  });
});
