import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  montarUrlProdutoComVariante,
  resolverVarianteInicialUrl,
} from "./url-variante-produto";

const ID_ATIVA = "11111111-1111-4111-8111-111111111111";
const ID_INATIVA = "22222222-2222-4222-8222-222222222222";
const ID_OUTRO_PRODUTO = "33333333-3333-4333-8333-333333333333";
const variantes = [
  { id: ID_ATIVA, isActive: true, stockQuantity: 0 },
  { id: ID_INATIVA, isActive: false, stockQuantity: 5 },
];

describe("seleção de variante por URL", () => {
  it("seleciona variante ativa mesmo indisponível", () => {
    const resultado = resolverVarianteInicialUrl({
      tipoProduto: "variable",
      variantes,
      varianteId: ID_ATIVA,
    });
    assert.equal(resultado?.id, ID_ATIVA);
    assert.equal(resultado?.stockQuantity, 0);
  });

  it("ignora parâmetro ausente, inválido, externo, inativo ou de produto simples", () => {
    for (const entrada of [
      { tipoProduto: "variable", varianteId: null },
      { tipoProduto: "variable", varianteId: "não-é-uuid" },
      { tipoProduto: "variable", varianteId: ID_OUTRO_PRODUTO },
      { tipoProduto: "variable", varianteId: ID_INATIVA },
      { tipoProduto: "simple", varianteId: ID_ATIVA },
    ]) {
      assert.equal(resolverVarianteInicialUrl({ ...entrada, variantes }), null);
    }
  });

  it("adiciona/remove variante preservando os outros parâmetros", () => {
    assert.equal(
      montarUrlProdutoComVariante({
        urlProduto: "https://loja.test/product/item?utm_source=teste#detalhes",
        varianteId: ID_ATIVA,
      }),
      `https://loja.test/product/item?utm_source=teste&variant=${ID_ATIVA}#detalhes`,
    );
    assert.equal(
      montarUrlProdutoComVariante({
        urlProduto: `/product/item?variant=${ID_ATIVA}&utm_source=teste`,
        varianteId: null,
      }),
      "/product/item?utm_source=teste",
    );
  });
});
