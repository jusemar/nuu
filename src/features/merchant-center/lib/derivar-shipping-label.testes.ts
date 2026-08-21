import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { derivarShippingLabel } from "./derivar-shipping-label";

const vinculo = (identificador: string, ativo = true) => ({
  tipoLogisticoId: identificador,
  tipoLogistico: { ativo, identificador },
});

describe("shipping_label Merchant", () => {
  it("omite quando não existe classificação aplicável", () => {
    assert.equal(
      derivarShippingLabel({ vinculosProduto: [], vinculosVariante: [] }),
      undefined,
    );
  });

  it("herda produto e respeita override da variante", () => {
    assert.equal(
      derivarShippingLabel({
        vinculosProduto: [vinculo("produto-pesado")],
        vinculosVariante: [],
      }),
      "produto-pesado",
    );
    assert.equal(
      derivarShippingLabel({
        vinculosProduto: [vinculo("produto-pesado")],
        vinculosVariante: [vinculo("produto-fragil")],
      }),
      "produto-fragil",
    );
  });

  it("combina múltiplas classificações de forma determinística", () => {
    const primeira = derivarShippingLabel({
      vinculosProduto: [vinculo("produto-pesado"), vinculo("grande-volume")],
      vinculosVariante: [],
    });
    const segunda = derivarShippingLabel({
      vinculosProduto: [vinculo("grande-volume"), vinculo("produto-pesado")],
      vinculosVariante: [],
    });
    assert.equal(primeira, "grande-volume+produto-pesado");
    assert.equal(segunda, primeira);
  });
});
