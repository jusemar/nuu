import assert from "node:assert/strict";
import test from "node:test";

import {
  identificarVarianteTecnicaProdutoSimples,
  resumirEstoqueVariantesProduto,
} from "./variante-tecnica-produto-simples";

const variante = {
  id: "variante-1",
  sku: "SKU-1",
  atributos: {},
  precoEmCentavos: 10_000,
  estoque: 7,
  ativa: true,
  principal: true,
};

test("identifica somente o registro técnico completo", () => {
  const resultado = identificarVarianteTecnicaProdutoSimples({
    skuProduto: "SKU-1",
    variantes: [variante],
  });
  assert.equal(resultado.situacao, "confiavel");
});

test("não escolhe a primeira variante quando existem duplicidades", () => {
  const resultado = identificarVarianteTecnicaProdutoSimples({
    skuProduto: "SKU-1",
    variantes: [variante, { ...variante, id: "variante-2" }],
  });
  assert.equal(resultado.situacao, "duplicada");
});

test("informa causas específicas de inconsistência", () => {
  assert.equal(
    identificarVarianteTecnicaProdutoSimples({
      skuProduto: "SKU-1",
      variantes: [],
    }).situacao,
    "ausente",
  );
  assert.equal(
    identificarVarianteTecnicaProdutoSimples({
      skuProduto: "SKU-1",
      variantes: [{ ...variante, ativa: false }],
    }).situacao,
    "inativa",
  );
  assert.equal(
    identificarVarianteTecnicaProdutoSimples({
      skuProduto: "SKU-1",
      variantes: [{ ...variante, sku: "OUTRO-SKU" }],
    }).situacao,
    "sku_inconsistente",
  );
});

test("resume variantes ativas por faixa sem somar estoque", () => {
  assert.deepEqual(
    resumirEstoqueVariantesProduto([
      { estoque: 2, ativa: true },
      { estoque: 8, ativa: true },
      { estoque: 100, ativa: false },
    ]),
    {
      variantesAtivas: 2,
      minimo: 2,
      maximo: 8,
      rotulo: "2 variante(s) · 2–8 un.",
    },
  );
});
