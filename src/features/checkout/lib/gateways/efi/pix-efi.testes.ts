import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { gerarTxidPixEfiDoPedido } from "./pix-efi";

describe("txid idempotente da cobrança Pix Efí", () => {
  it("gera o mesmo txid válido para o mesmo pedido", () => {
    const primeiraGeracao = gerarTxidPixEfiDoPedido("#1010");
    const segundaGeracao = gerarTxidPixEfiDoPedido("#1010");

    assert.equal(primeiraGeracao, segundaGeracao);
    assert.match(primeiraGeracao, /^[A-Za-z0-9]{26,35}$/);
  });

  it("não compartilha txid entre pedidos", () => {
    assert.notEqual(
      gerarTxidPixEfiDoPedido("#1010"),
      gerarTxidPixEfiDoPedido("#1011"),
    );
  });
});
