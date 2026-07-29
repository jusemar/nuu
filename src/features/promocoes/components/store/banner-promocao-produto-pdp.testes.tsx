import assert from "node:assert/strict";
import { describe, it } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BannerPromocaoProdutoPdp } from "./banner-promocao-produto-pdp";

describe("BannerPromocaoProdutoPdp", () => {
  it("nao renderiza sem promocao oficial ativa", () => {
    const conteudo = renderToStaticMarkup(
      <BannerPromocaoProdutoPdp promocao={null} />,
    );

    assert.equal(conteudo, "");
  });

  it("exibe apenas os valores recebidos da promocao oficial", () => {
    const conteudo = renderToStaticMarkup(
      <BannerPromocaoProdutoPdp
        promocao={{
          ativa: true,
          precoOriginalFormatado: "R$ 500,00",
          precoPromocionalFormatado: "R$ 400,00",
          economiaFormatada: "R$ 100,00",
          percentualOff: 20,
          rotuloDesconto: "20% OFF",
        }}
      />,
    );

    assert.match(conteudo, /R\$ 500,00/);
    assert.match(conteudo, /R\$ 400,00/);
    assert.match(conteudo, /R\$ 100,00/);
    assert.match(conteudo, /20% OFF/);
  });
});
