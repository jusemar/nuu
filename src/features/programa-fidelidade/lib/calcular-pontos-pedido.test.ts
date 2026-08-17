import assert from "node:assert/strict";
import test from "node:test";

import {
  calcularPontosItensPedido,
  calcularPontosPorValor,
  ratearCupomEntreItens,
} from "./calcular-pontos-pedido";

test("calcula pedido misto com regra global e personalizada", () => {
  const resultado = calcularPontosItensPedido({
    descontoCupomEmCentavos: 0,
    itens: [
      {
        id: "racao",
        categoriaId: "c1",
        valorBrutoEmCentavos: 10_000,
        ativa: true,
        origemRegra: "personalizada",
        taxaPontosPorReal: "2.0000",
      },
      {
        id: "informatica",
        categoriaId: "c2",
        valorBrutoEmCentavos: 20_000,
        ativa: true,
        origemRegra: "personalizada",
        taxaPontosPorReal: "0.5000",
      },
    ],
  });
  assert.deepEqual(
    resultado.map((item) => item.pontos),
    ["200.0000", "100.0000"],
  );
});

test("categoria desativada não gera pontos", () => {
  assert.equal(
    calcularPontosItensPedido({
      descontoCupomEmCentavos: 0,
      itens: [
        {
          id: "1",
          categoriaId: "c1",
          valorBrutoEmCentavos: 1000,
          ativa: false,
          origemRegra: "global",
          taxaPontosPorReal: "1.0000",
        },
      ],
    }).length,
    0,
  );
});

test("rateio por maiores sobras conserva exatamente o cupom", () => {
  const rateio = ratearCupomEntreItens({
    descontoCupomEmCentavos: 100,
    itens: [
      { id: "b", valorBrutoEmCentavos: 100 },
      { id: "a", valorBrutoEmCentavos: 100 },
      { id: "c", valorBrutoEmCentavos: 100 },
    ],
  });
  assert.equal(
    [...rateio.values()].reduce((soma, valor) => soma + valor, 0),
    100,
  );
  assert.deepEqual([...rateio.entries()].sort(), [
    ["a", 34],
    ["b", 33],
    ["c", 33],
  ]);
});

test("arredonda pontos em quatro casas de forma determinística", () => {
  assert.equal(
    calcularPontosPorValor({ valorEmCentavos: 1, taxaPontosPorReal: "0.5000" }),
    "0.0050",
  );
});

test("não gera pontos sobre cupom nem crédito de fidelidade", () => {
  const [item] = calcularPontosItensPedido({
    descontoCupomEmCentavos: 1000,
    itens: [
      {
        id: "1",
        categoriaId: "c1",
        valorBrutoEmCentavos: 10_000,
        creditoFidelidadeRateadoEmCentavos: 2000,
        ativa: true,
        origemRegra: "global",
        taxaPontosPorReal: "1.0000",
      },
    ],
  });
  assert.equal(item?.valorBaseEmCentavos, 7000);
  assert.equal(item?.pontos, "70.0000");
});
