import assert from "node:assert/strict";
import test from "node:test";

import { decidirCancelamentoPedido } from "./decidir-cancelamento-pedido";

test("cancela pedido não pago sem reembolso", () => {
  assert.equal(
    decidirCancelamentoPedido({
      status: "pending",
      pagamentoStatus: "pending",
      gateway: "efibank",
      externalizado: false,
    }),
    "cancelar_sem_reembolso",
  );
});
test("pedido pago não externalizado exige reembolso", () => {
  assert.equal(
    decidirCancelamentoPedido({
      status: "paid",
      pagamentoStatus: "paid",
      gateway: "stripe",
      externalizado: false,
    }),
    "cancelar_com_reembolso",
  );
});
test("pedido enviado vira devolução", () => {
  assert.equal(
    decidirCancelamentoPedido({
      status: "shipped",
      pagamentoStatus: "paid",
      gateway: "stripe",
      externalizado: false,
    }),
    "orientar_devolucao",
  );
});
test("Laquila externalizada sempre bloqueia cancelamento automático", () => {
  assert.equal(
    decidirCancelamentoPedido({
      status: "paid",
      pagamentoStatus: "paid",
      gateway: "stripe",
      externalizado: true,
    }),
    "bloquear_externalizado",
  );
});
test("cancelamento repetido é terminal", () => {
  assert.equal(
    decidirCancelamentoPedido({
      status: "canceled",
      pagamentoStatus: "pending",
      gateway: "efibank",
      externalizado: false,
    }),
    "ja_finalizado",
  );
});
