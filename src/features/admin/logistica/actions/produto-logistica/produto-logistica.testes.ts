import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { vincularTipoLogisticoProduto } from "./vincular-tipo-logistico-produto";

describe("produto logistica actions", () => {
  it("vincular tipo exige produto", async () => {
    const resposta = await vincularTipoLogisticoProduto({
      produtoId: "",
      tipoLogisticoId: "8c735e85-0ca0-4a81-9210-e05b858cfebd",
    });
    assert.equal(resposta.sucesso, false);
  });
});

