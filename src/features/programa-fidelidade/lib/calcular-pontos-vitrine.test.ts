import assert from "node:assert/strict";
import test from "node:test";

import {
  calcularPontosProdutoVitrine,
  formatarPontosProdutoVitrine,
  resolverPontosVitrineProdutos,
} from "./calcular-pontos-vitrine";

const regraGlobal = {
  programaAtivo: true,
  categoriaAtiva: true,
  pontosPorReal: "1.0000",
};

test("produto de R$ 100 gera 100 pontos pela regra global", () => {
  assert.equal(
    calcularPontosProdutoVitrine({
      precoEmCentavos: 10_000,
      regra: regraGlobal,
    }),
    "100.0000",
  );
});

test("regra personalizada da categoria multiplica a estimativa", () => {
  assert.equal(
    calcularPontosProdutoVitrine({
      precoEmCentavos: 10_000,
      regra: { ...regraGlobal, pontosPorReal: "2.0000" },
    }),
    "200.0000",
  );
});

test("usa diretamente o preço promocional vigente recebido", () => {
  assert.equal(
    calcularPontosProdutoVitrine({
      precoEmCentavos: 7_500,
      regra: regraGlobal,
    }),
    "75.0000",
  );
});

test("não exibe pontuação para programa ou categoria desativados", () => {
  assert.equal(
    calcularPontosProdutoVitrine({
      precoEmCentavos: 10_000,
      regra: { ...regraGlobal, programaAtivo: false },
    }),
    null,
  );
  assert.equal(
    calcularPontosProdutoVitrine({
      precoEmCentavos: 10_000,
      regra: { ...regraGlobal, categoriaAtiva: false },
    }),
    null,
  );
});

test("mantém até quatro casas quando a regra gera pontos fracionários", () => {
  assert.equal(formatarPontosProdutoVitrine("12.5000"), "12,5");
});

test("status global suspende e reativa a vitrine sem perder regras de categoria", () => {
  const produtos = [
    { chave: "global", categoriaId: "geral", precoEmCentavos: 10_000 },
    {
      chave: "personalizado",
      categoriaId: "racoes",
      precoEmCentavos: 10_000,
    },
    { chave: "inativo", categoriaId: "nao-elegivel", precoEmCentavos: 10_000 },
  ];
  const regrasCategorias = [
    { categoriaId: "racoes", ativa: true, pontosPorReal: "2.0000" },
    { categoriaId: "nao-elegivel", ativa: false, pontosPorReal: null },
  ];

  assert.deepEqual(
    resolverPontosVitrineProdutos({
      produtos,
      configuracao: { ativo: false, pontosPorReal: "1.0000" },
      regrasCategorias,
    }),
    {},
  );

  assert.deepEqual(
    resolverPontosVitrineProdutos({
      produtos,
      configuracao: { ativo: true, pontosPorReal: "1.0000" },
      regrasCategorias,
    }),
    { global: "100.0000", personalizado: "200.0000" },
  );
});
