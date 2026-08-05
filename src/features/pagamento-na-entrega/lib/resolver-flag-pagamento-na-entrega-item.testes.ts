import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolverFlagPagamentoNaEntregaItem } from "./resolver-flag-pagamento-na-entrega-item";

describe("heranca da flag de pagamento na entrega (produto -> variante)", () => {
  it("herda o produto quando a variante nao decidiu (null)", () => {
    assert.equal(
      resolverFlagPagamentoNaEntregaItem({
        produtoAceitaPagamentoNaEntrega: true,
        varianteAceitaPagamentoNaEntrega: null,
      }),
      true,
    );

    assert.equal(
      resolverFlagPagamentoNaEntregaItem({
        produtoAceitaPagamentoNaEntrega: false,
        varianteAceitaPagamentoNaEntrega: null,
      }),
      false,
    );
  });

  it("a variante vence quando decide explicitamente", () => {
    // O caso crítico: `false` da variante precisa sobreviver a um produto `true`.
    // Se alguém trocar o `??` por `||` no resolvedor, esta linha quebra.
    assert.equal(
      resolverFlagPagamentoNaEntregaItem({
        produtoAceitaPagamentoNaEntrega: true,
        varianteAceitaPagamentoNaEntrega: false,
      }),
      false,
    );

    assert.equal(
      resolverFlagPagamentoNaEntregaItem({
        produtoAceitaPagamentoNaEntrega: false,
        varianteAceitaPagamentoNaEntrega: true,
      }),
      true,
    );
  });
});
