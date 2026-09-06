import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  converterValorPixEmCentavos,
  valorPixCorrespondeAoPagamento,
} from "./validar-valor-pix";

describe("valor confirmado pela Efí", () => {
  it("converte o valor decimal da Efí sem arredondamento", () => {
    assert.equal(converterValorPixEmCentavos("233.72"), 23_372);
    assert.equal(converterValorPixEmCentavos("233.7"), 23_370);
    assert.equal(converterValorPixEmCentavos("233"), 23_300);
  });

  it("rejeita valor ausente, inválido ou diferente do pedido", () => {
    assert.equal(converterValorPixEmCentavos(undefined), null);
    assert.equal(converterValorPixEmCentavos("233,72"), null);
    assert.equal(
      valorPixCorrespondeAoPagamento({
        valorRecebido: "233.71",
        valorEsperadoEmCentavos: 23_372,
      }),
      false,
    );
  });

  it("aceita somente o valor exato do pagamento histórico", () => {
    assert.equal(
      valorPixCorrespondeAoPagamento({
        valorRecebido: "233.72",
        valorEsperadoEmCentavos: 23_372,
      }),
      true,
    );
  });
});
