import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decidirExecucaoPedidoLaquila } from "./decidir-execucao-pedido-laquila";
import { criarChaveIdempotenciaPedidoLaquila } from "./montar-pedido-laquila";

describe("idempotência do pedido Laquila", () => {
  it("permite a primeira aquisição e uma falha comprovadamente segura", () => {
    assert.equal(
      decidirExecucaoPedidoLaquila({
        status: "pendente",
        hashPersistido: "a",
        hashAtual: "a",
      }),
      "adquirir",
    );
    assert.equal(
      decidirExecucaoPedidoLaquila({
        status: "falha",
        hashPersistido: "a",
        hashAtual: "a",
      }),
      "adquirir",
    );
  });

  it("não repete processando, criado ou resultado indeterminado", () => {
    for (const status of [
      "processando",
      "criado",
      "resultado_indeterminado",
    ] as const) {
      assert.equal(
        decidirExecucaoPedidoLaquila({
          status,
          hashPersistido: "a",
          hashAtual: "a",
        }),
        "reutilizar",
      );
    }
  });

  it("detecta hash divergente e separa grupos na chave", () => {
    assert.equal(
      decidirExecucaoPedidoLaquila({
        status: "pendente",
        hashPersistido: "a",
        hashAtual: "b",
      }),
      "hash_divergente",
    );
    assert.notEqual(
      criarChaveIdempotenciaPedidoLaquila("pedido-1", "grupo-a"),
      criarChaveIdempotenciaPedidoLaquila("pedido-1", "grupo-b"),
    );
  });
});
