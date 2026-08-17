import assert from "node:assert/strict";
import test from "node:test";

import {
  calcularCreditoPontos,
  calcularLimitesResgate,
  ratearCreditoFidelidadeEntreItens,
} from "./calcular-resgate-fidelidade";

test("converte pontos sem arredondar crédito para cima", () => {
  assert.equal(
    calcularCreditoPontos({
      pontos: "333.0000",
      pontosConversao: "100.0000",
      valorCreditoEmCentavos: 1000,
    }),
    3330,
  );
});

test("limita crédito aos produtos e preserva R$ 1,00", () => {
  assert.deepEqual(
    calcularLimitesResgate({
      saldoDisponivel: "1000.0000",
      pontosConversao: "100.0000",
      valorCreditoEmCentavos: 1000,
      baseElegivelEmCentavos: 5000,
      totalAntesJurosEmCentavos: 5500,
      valorMinimoPagamentoEmCentavos: 100,
    }),
    { limiteCreditoEmCentavos: 5000, maximoPontos: "500.0000" },
  );
});

test("rateio do crédito preserva soma determinística após cupom", () => {
  const rateio = ratearCreditoFidelidadeEntreItens({
    itens: [
      { id: "a", valorBrutoEmCentavos: 1000 },
      { id: "b", valorBrutoEmCentavos: 2000 },
    ],
    descontoCupomEmCentavos: 300,
    creditoFidelidadeEmCentavos: 1000,
  });
  assert.equal(
    [...rateio.values()].reduce((a, b) => a + b, 0),
    1000,
  );
});
