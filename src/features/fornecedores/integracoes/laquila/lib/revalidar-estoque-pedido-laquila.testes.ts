import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { revalidarEstoqueItensPedidoLaquila } from "./revalidar-estoque-pedido-laquila";

const item = [{ cd_item: "1104095", qt_pedida: 1 }];

describe("revalidação de estoque Laquila antes do 00002", () => {
  it("aceita saldo 100 como disponibilidade para a quantidade pedida", () => {
    const resultado = revalidarEstoqueItensPedidoLaquila(item, [
      {
        cd_item: "1104095",
        qt_saldo: "100",
        sit_estoque: "DISPONIVEL",
        vl_preco: "999,99",
      },
    ]);

    assert.equal(resultado.sucesso, true);
    if (resultado.sucesso)
      assert.equal(resultado.itens[0]?.saldoInformado, 100);
  });

  it("bloqueia item indisponível, ausente ou com saldo menor", () => {
    const indisponivel = revalidarEstoqueItensPedidoLaquila(item, [
      { cd_item: "1104095", qt_saldo: "0", sit_estoque: "INDISPONIVEL" },
    ]);
    const ausente = revalidarEstoqueItensPedidoLaquila(item, []);
    const insuficiente = revalidarEstoqueItensPedidoLaquila(
      [{ cd_item: "1104095", qt_pedida: 3 }],
      [{ cd_item: "1104095", qt_saldo: "2", sit_estoque: "DISPONIVEL" }],
    );

    assert.equal(indisponivel.sucesso, false);
    assert.equal(ausente.sucesso, false);
    assert.equal(insuficiente.sucesso, false);
  });
});
