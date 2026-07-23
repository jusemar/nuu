import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularProgressoFreteGratisPdp } from "./calcular-progresso-frete-gratis-pdp";

describe("calcular progresso de frete gratis na PDP", () => {
  it("usa centavos como fonte numerica do subtotal", () => {
    const resultado = calcularProgressoFreteGratisPdp({
      valorUnitarioEmCentavos: 5_000,
      quantidade: 2,
      subtotalMinimoEmReais: 299,
    });

    assert.deepEqual(resultado, {
      disponivel: true,
      subtotalEmCentavos: 10_000,
      subtotalMinimoEmCentavos: 29_900,
      atingido: false,
      faltanteEmCentavos: 19_900,
      percentual: 33,
    });
  });

  it("mantem fallback seguro quando o preco nao esta disponivel", () => {
    const resultado = calcularProgressoFreteGratisPdp({
      valorUnitarioEmCentavos: null,
      quantidade: 1,
      subtotalMinimoEmReais: 299,
    });

    assert.equal(resultado.disponivel, false);
    assert.equal(resultado.atingido, false);
    assert.equal(resultado.percentual, 0);
  });
});
