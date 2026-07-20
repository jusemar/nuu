import assert from "node:assert/strict";
import test from "node:test";

import type { PrecoProdutoCalculado } from "@/features/precificacao";

import { resolverDisponibilidadeCompraPdp } from "./resolver-disponibilidade-compra-pdp";

const precoValido = {
  pix: { ativo: true, valorEmCentavos: 10_000 },
  cartao: { ativo: true, valorEmCentavos: 11_000 },
} as PrecoProdutoCalculado;

const modalidade = { isActive: true } as Parameters<
  typeof resolverDisponibilidadeCompraPdp
>[0]["modalidade"];

const variante = {
  id: "variante-1",
  isActive: true,
  stockQuantity: 2,
} as Parameters<
  typeof resolverDisponibilidadeCompraPdp
>[0]["varianteSelecionada"];

test("mantém modalidades sem estoque local compráveis", () => {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "simple",
    modalidade,
    precoCalculado: precoValido,
    varianteSelecionada: null,
    possuiVariantesPublicas: false,
  });

  assert.deepEqual(resultado, {
    estado: "disponivel",
    estoqueMaximo: null,
  });
});

test("solicita seleção antes de liberar produto variável", () => {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "variable",
    modalidade,
    precoCalculado: precoValido,
    varianteSelecionada: null,
    possuiVariantesPublicas: true,
  });

  assert.equal(resultado.estado, "selecione_variante");
});

test("bloqueia variante sem estoque", () => {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "variable",
    modalidade,
    precoCalculado: precoValido,
    varianteSelecionada: { ...variante!, stockQuantity: 0 },
    possuiVariantesPublicas: true,
  });

  assert.equal(resultado.estado, "indisponivel");
});

test("libera variante ativa com estoque e preço válido", () => {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "variable",
    modalidade,
    precoCalculado: precoValido,
    varianteSelecionada: variante,
    possuiVariantesPublicas: true,
  });

  assert.deepEqual(resultado, { estado: "disponivel", estoqueMaximo: 2 });
});

test("bloqueia produto sem forma de pagamento com preço válido", () => {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "simple",
    modalidade,
    precoCalculado: {
      ...precoValido,
      pix: { ...precoValido.pix, ativo: false },
      cartao: { ...precoValido.cartao, ativo: false },
    },
    varianteSelecionada: null,
    possuiVariantesPublicas: false,
  });

  assert.equal(resultado.estado, "indisponivel");
});
