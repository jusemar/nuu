import assert from "node:assert/strict";
import test from "node:test";

import type { PrecoProdutoCalculado } from "@/features/precificacao/client";

import { resolverDisponibilidadeCompraPdp } from "./resolver-disponibilidade-compra-pdp";

const precoValido = {
  pix: { ativo: true, valorEmCentavos: 10_000 },
  cartao: { ativo: true, valorEmCentavos: 11_000 },
} as PrecoProdutoCalculado;

const modalidade = { isActive: true, type: "pre_sale" } as Parameters<
  typeof resolverDisponibilidadeCompraPdp
>[0]["modalidade"];

const variante = {
  id: "variante-1",
  isActive: true,
  stockQuantity: 2,
} as Parameters<
  typeof resolverDisponibilidadeCompraPdp
>[0]["varianteSelecionada"];

const varianteTecnica = {
  situacao: "confiavel" as const,
  variante: {
    id: "tecnica-1",
    sku: "SIMPLES-1",
    atributos: {},
    precoEmCentavos: 10_000,
    estoque: 2,
    ativa: true,
    principal: true,
  },
};

test("mantém modalidades sem estoque local compráveis", () => {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "simple",
    modalidade,
    precoCalculado: precoValido,
    varianteSelecionada: null,
    possuiVariantesPublicas: false,
    varianteTecnicaProdutoSimples: varianteTecnica,
  });

  assert.deepEqual(resultado, {
    estado: "disponivel",
    estoqueMaximo: null,
  });
});

test("usa o estoque técnico na modalidade de estoque próprio", () => {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "simple",
    modalidade: { ...modalidade!, type: "stock" },
    precoCalculado: precoValido,
    varianteSelecionada: null,
    possuiVariantesPublicas: false,
    varianteTecnicaProdutoSimples: varianteTecnica,
  });

  assert.deepEqual(resultado, { estado: "disponivel", estoqueMaximo: 2 });
});

test("bloqueia estoque próprio simples sem saldo", () => {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "simple",
    modalidade: { ...modalidade!, type: "stock" },
    precoCalculado: precoValido,
    varianteSelecionada: null,
    possuiVariantesPublicas: false,
    varianteTecnicaProdutoSimples: {
      ...varianteTecnica,
      variante: { ...varianteTecnica.variante, estoque: 0 },
    },
  });

  assert.equal(resultado.estado, "indisponivel");
});

test("não expõe detalhes internos quando a variante técnica está inconsistente", () => {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "simple",
    modalidade: { ...modalidade!, type: "stock" },
    precoCalculado: precoValido,
    varianteSelecionada: null,
    possuiVariantesPublicas: false,
    varianteTecnicaProdutoSimples: {
      situacao: "sku_inconsistente",
      motivo: "O SKU da variante técnica difere do SKU do produto simples.",
    },
  });

  assert.deepEqual(resultado, {
    estado: "indisponivel",
    estoqueMaximo: 0,
    motivo: "Este produto está indisponível no momento.",
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
    varianteTecnicaProdutoSimples: varianteTecnica,
  });

  assert.equal(resultado.estado, "indisponivel");
});

test("bloqueia logística inválida com mensagem pública neutra", () => {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "simple",
    modalidade,
    precoCalculado: precoValido,
    varianteSelecionada: null,
    possuiVariantesPublicas: false,
    varianteTecnicaProdutoSimples: varianteTecnica,
    logisticaValida: false,
  });

  assert.deepEqual(resultado, {
    estado: "indisponivel",
    estoqueMaximo: 0,
    motivo: "Este produto está temporariamente indisponível.",
  });
});
