import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EntradaConsistenciaTrocoPedido } from "../types/pagamento-na-entrega.types";
import { avaliarConsistenciaTrocoPedido } from "./avaliar-consistencia-troco-pedido";

function avaliar(ajustes: Partial<EntradaConsistenciaTrocoPedido> = {}) {
  return avaliarConsistenciaTrocoPedido({
    formaEscolhida: "dinheiro",
    precisaTroco: true,
    trocoParaEmCentavos: 20_000,
    valorAReceberEmCentavos: 15_000,
    totalAtualDoPedidoEmCentavos: 15_000,
    ...ajustes,
  });
}

describe("consistencia do troco do pedido", () => {
  it("aceita dinheiro com troco maior que o total e calcula a devolucao", () => {
    const resultado = avaliar();

    assert.equal(resultado.consistente, true);
    assert.deepEqual(resultado.problemas, []);
    assert.equal(resultado.trocoADevolverEmCentavos, 5_000);
    assert.equal(resultado.divergenciaDeTotalEmCentavos, 0);
  });

  it("aceita dinheiro sem troco (cliente leva o valor exato)", () => {
    const resultado = avaliar({
      precisaTroco: false,
      trocoParaEmCentavos: null,
    });

    assert.equal(resultado.consistente, true);
    assert.equal(resultado.trocoADevolverEmCentavos, null);
  });

  it("recusa troco em forma que nao e dinheiro", () => {
    const resultado = avaliar({
      formaEscolhida: "debito_entrega",
      precisaTroco: true,
      trocoParaEmCentavos: 20_000,
    });

    assert.equal(resultado.consistente, false);
    assert.deepEqual(
      resultado.problemas.map((p) => p.codigo),
      ["troco-para-forma-nao-dinheiro"],
    );
  });

  it("recusa valor de troco quando o pedido disse que nao precisa", () => {
    const resultado = avaliar({
      precisaTroco: false,
      trocoParaEmCentavos: 20_000,
    });

    assert.deepEqual(
      resultado.problemas.map((p) => p.codigo),
      ["troco-informado-sem-necessidade"],
    );
  });

  it("recusa pedido que pede troco sem dizer para quanto", () => {
    const resultado = avaliar({
      precisaTroco: true,
      trocoParaEmCentavos: null,
    });

    assert.deepEqual(
      resultado.problemas.map((p) => p.codigo),
      ["troco-ausente"],
    );
  });

  it("recusa troco menor que o total", () => {
    const resultado = avaliar({
      trocoParaEmCentavos: 10_000,
      valorAReceberEmCentavos: 15_000,
    });

    assert.deepEqual(
      resultado.problemas.map((p) => p.codigo),
      ["troco-menor-que-total"],
    );
  });

  it("sinaliza quando o total do pedido mudou depois do combinado", () => {
    const resultado = avaliar({
      valorAReceberEmCentavos: 15_000,
      totalAtualDoPedidoEmCentavos: 18_000,
    });

    assert.equal(resultado.consistente, false);
    assert.equal(resultado.divergenciaDeTotalEmCentavos, 3_000);
    assert.deepEqual(
      resultado.problemas.map((p) => p.codigo),
      ["total-do-pedido-divergente"],
    );
    // A devolução continua calculada sobre o valor combinado com o cliente, não sobre
    // o total novo — quem decide o que fazer com a diferença é o operador.
    assert.equal(resultado.trocoADevolverEmCentavos, 5_000);
  });

  it("nao acusa divergencia quando nao ha total atual para comparar", () => {
    const resultado = avaliar({ totalAtualDoPedidoEmCentavos: null });

    assert.equal(resultado.consistente, true);
    assert.equal(resultado.divergenciaDeTotalEmCentavos, null);
  });

  it("nunca devolve troco negativo", () => {
    const resultado = avaliar({
      precisaTroco: true,
      trocoParaEmCentavos: 15_000,
      valorAReceberEmCentavos: 15_000,
    });

    assert.equal(resultado.trocoADevolverEmCentavos, 0);
    assert.equal(resultado.consistente, true);
  });
});
