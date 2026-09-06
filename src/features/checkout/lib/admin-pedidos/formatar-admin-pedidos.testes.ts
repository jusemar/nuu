import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { serializarProviderResponseAdminPedido } from "./formatar-admin-pedidos";

describe("provider response no admin", () => {
  it("remove segredo, documento e payload Pix bruto da resposta Efí", () => {
    const serializado = serializarProviderResponseAdminPedido(
      {
        token: "segredo",
        devedor: { cpf: "00000000000" },
        pixCopiaECola: "000201-segredo-operacional",
        imagemQrcode: "data:image/png;base64,segredo-operacional",
        txid: "txid-operacional",
      },
      "efibank",
    );

    assert.equal(serializado.includes("segredo"), false);
    assert.equal(serializado.includes("00000000000"), false);
    assert.equal(serializado.includes("txid-operacional"), true);
  });

  it("não muda a serialização existente dos outros gateways", () => {
    assert.equal(
      serializarProviderResponseAdminPedido({ id: "stripe" }, "stripe"),
      '{\n  "id": "stripe"\n}',
    );
  });
});
