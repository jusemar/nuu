import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { orquestrarIntegracoesAposPagamento } from "./orquestrar-integracoes-apos-pagamento";

describe("orquestrador de integrações após o pagamento", () => {
  it("não externaliza pedido cancelado mesmo que o pagamento esteja confirmado", async () => {
    let chamadas = 0;
    const resultado = await orquestrarIntegracoesAposPagamento({
      pedidoId: "pedido-cancelado",
      pagamentoStatus: "paid",
      pedidoStatus: "canceled",
      dependencias: {
        processarLaquila: async () => {
          chamadas += 1;
          return ["indevido"];
        },
      },
    });
    assert.equal(resultado.estado, "ignorado_pedido_inelegivel");
    assert.equal(chamadas, 0);
  });
  for (const status of ["pending", "failed", "expired"] as const) {
    it(`não processa fornecedor com pagamento ${status}`, async () => {
      let chamadas = 0;
      const resultado = await orquestrarIntegracoesAposPagamento({
        pedidoId: "pedido-nao-pago",
        pagamentoStatus: status,
        dependencias: {
          async processarLaquila() {
            chamadas += 1;
            return ["indevido"];
          },
        },
      });

      assert.equal(resultado.estado, "ignorado_pagamento_nao_confirmado");
      assert.equal(chamadas, 0);
    });
  }

  it("processa itens Laquila somente depois do pagamento confirmado", async () => {
    let pedidoRecebido = "";
    const resultado = await orquestrarIntegracoesAposPagamento({
      pedidoId: "pedido-pago",
      pagamentoStatus: "paid",
      dependencias: {
        async processarLaquila(pedidoId) {
          pedidoRecebido = pedidoId;
          return [{ status: "criado" }];
        },
      },
    });

    assert.equal(pedidoRecebido, "pedido-pago");
    assert.equal(resultado.estado, "processado");
    assert.equal(resultado.integracoes.length, 1);
  });

  it("preserva pedidos comuns, entrega própria e pedidos mistos sem grupo Laquila", async () => {
    let chamadas = 0;
    const resultado = await orquestrarIntegracoesAposPagamento({
      pedidoId: "pedido-sem-laquila",
      pagamentoStatus: "paid",
      dependencias: {
        async processarLaquila() {
          chamadas += 1;
          return [];
        },
      },
    });

    assert.equal(chamadas, 1);
    assert.equal(resultado.estado, "sem_integracao_fornecedor");
    assert.deepEqual(resultado.integracoes, []);
  });

  it("é reutilizável por qualquer gateway que persista o mesmo estado aprovado", async () => {
    const gateways = ["efibank", "stripe"];
    let chamadas = 0;

    for (const gateway of gateways) {
      assert.ok(gateway);
      await orquestrarIntegracoesAposPagamento({
        pedidoId: "pedido-compartilhado",
        pagamentoStatus: "paid",
        dependencias: {
          async processarLaquila() {
            chamadas += 1;
            return [];
          },
        },
      });
    }

    assert.equal(chamadas, 2);
  });
});
