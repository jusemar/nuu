import assert from "node:assert/strict";
import test from "node:test";

import { ratearCupomEntreItens } from "@/features/programa-fidelidade/lib/calcular-pontos-pedido";

import { baseComissionavelItem } from "../../lib/comissoes-representantes/base-comissionavel-item";
test("base comercial desconta cupom e crédito sem juros nem taxas", () => {
  assert.deepEqual(
    baseComissionavelItem({
      quantidade: 2,
      precoComercialUnitarioEmCentavos: 10000,
      descontoCupomRateadoEmCentavos: 2000,
      creditoFidelidadeRateadoEmCentavos: 1000,
    }),
    {
      quantidade: 2,
      precoUnitarioVendidoCentavos: 10000,
      descontoItemCentavos: 3000,
      valorLiquidoItemCentavos: 17000,
    },
  );
});
test("legado não usa catálogo atual e descontos não tornam a base negativa", () => {
  assert.throws(() =>
    baseComissionavelItem({
      quantidade: 1,
      precoComercialUnitarioEmCentavos: null,
      descontoCupomRateadoEmCentavos: null,
      creditoFidelidadeRateadoEmCentavos: 0,
    }),
  );
  assert.equal(
    baseComissionavelItem({
      quantidade: 1,
      precoComercialUnitarioEmCentavos: 10,
      descontoCupomRateadoEmCentavos: 20,
      creditoFidelidadeRateadoEmCentavos: 0,
    }).valorLiquidoItemCentavos,
    0,
  );
});
test("rateio existente preserva centavos e desempate estável", () => {
  const r = ratearCupomEntreItens({
    itens: [
      { id: "a", valorBrutoEmCentavos: 100 },
      { id: "b", valorBrutoEmCentavos: 100 },
      { id: "c", valorBrutoEmCentavos: 100 },
    ],
    descontoCupomEmCentavos: 10,
  });
  assert.deepEqual(
    [...r],
    [
      ["a", 4],
      ["b", 3],
      ["c", 3],
    ],
  );
});
