import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EXPIRACAO_PIX_EM_SEGUNDOS,
  gerarTxidPixEfiDoPedido,
  resolverExpiracaoCobrancaPixEfi,
} from "./pix-efi";

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

  it("usa outro txid idempotente para uma nova geração do mesmo pedido", () => {
    const primeiraGeracao = gerarTxidPixEfiDoPedido("#1010", 1);
    const segundaGeracao = gerarTxidPixEfiDoPedido("#1010", 2);

    assert.notEqual(primeiraGeracao, segundaGeracao);
    assert.equal(segundaGeracao, gerarTxidPixEfiDoPedido("#1010", 2));
    assert.match(segundaGeracao, /^[A-Za-z0-9]{26,35}$/);
  });

  it("configura novas cobranças com duas horas de validade", () => {
    assert.equal(EXPIRACAO_PIX_EM_SEGUNDOS, 7200);
  });

  it("persiste a expiração real calculada pelo calendário retornado pela Efí", () => {
    assert.equal(
      resolverExpiracaoCobrancaPixEfi({
        criacao: "2026-09-06T18:00:00.000Z",
        expiracao: 7200,
      }).toISOString(),
      "2026-09-06T20:00:00.000Z",
    );
  });
});
