import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  gerarHashPayloadPedidoLaquila,
  montarItensPedidoLaquila,
  montarPedidoLaquilaSemCredenciais,
  obterValorUnitarioPedidoLaquila,
  sanitizarPedidoLaquila,
} from "./montar-pedido-laquila";

describe("payload Laquila 00002", () => {
  it("usa o preço persistido pós-promoção e ignora qualquer cupom global", () => {
    assert.equal(obterValorUnitarioPedidoLaquila(13_000), 130);
    assert.equal(obterValorUnitarioPedidoLaquila(15_000), 150);
    // Cupons de R$ 10 ou R$ 30 não são entrada desta regra.
    assert.equal(obterValorUnitarioPedidoLaquila(13_000), 130);
  });

  it("mantém quantidade e preço unitário separados", () => {
    assert.deepEqual(
      montarItensPedidoLaquila([
        {
          codigoFornecedor: "ABC",
          quantidade: 2,
          precoUnitarioEmCentavos: 13_000,
        },
      ]),
      [{ cd_item: "ABC", qt_pedida: 2, vl_unitario: 130 }],
    );
  });

  it("sanitiza PII e produz hash determinístico", () => {
    const pedido = montarPedidoLaquilaSemCredenciais({
      documento: "123.456.789-01",
      nome: "Cliente Teste",
      email: "CLIENTE@example.com",
      telefone: "(41) 99999-9999",
      cdTransportador: "17499",
      itens: [
        {
          codigoFornecedor: "10",
          quantidade: 1,
          precoUnitarioEmCentavos: 13_000,
        },
      ],
    });
    const sanitizado = sanitizarPedidoLaquila(pedido);

    assert.deepEqual(sanitizado, {
      cd_transportador: "17499",
      itens: [{ cd_item: "10", qt_pedida: 1, vl_unitario: 130 }],
    });
    assert.equal(JSON.stringify(sanitizado).includes("12345678901"), false);
    assert.equal(
      gerarHashPayloadPedidoLaquila(pedido),
      gerarHashPayloadPedidoLaquila(pedido),
    );
  });
});
