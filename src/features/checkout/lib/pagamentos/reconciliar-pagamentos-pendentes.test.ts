import assert from "node:assert/strict";
import test from "node:test";

import {
  classificarSessaoStripeParaReconciliacao,
  pixPodeExpirar,
} from "./politica-reconciliacao-pagamento";

test("Stripe pago sempre é confirmado, inclusive com evento fora de ordem", () => {
  assert.equal(
    classificarSessaoStripeParaReconciliacao({
      status: "expired",
      pagamentoStatus: "paid",
    }),
    "confirmar",
  );
});

test("Stripe só expira quando a sessão real está expirada e não paga", () => {
  assert.equal(
    classificarSessaoStripeParaReconciliacao({
      status: "expired",
      pagamentoStatus: "unpaid",
    }),
    "expirar",
  );
  assert.equal(
    classificarSessaoStripeParaReconciliacao({
      status: "open",
      pagamentoStatus: "unpaid",
    }),
    "manter_pendente",
  );
});

test("Pix somente expira depois do vencimento e enquanto pendente", () => {
  const agora = new Date("2026-08-16T12:00:00.000Z");
  assert.equal(
    pixPodeExpirar({
      status: "pending",
      expiraEm: new Date("2026-08-16T11:59:59.000Z"),
      agora,
    }),
    true,
  );
  assert.equal(
    pixPodeExpirar({
      status: "pending",
      expiraEm: new Date("2026-08-16T12:00:01.000Z"),
      agora,
    }),
    false,
  );
  assert.equal(
    pixPodeExpirar({ status: "paid", expiraEm: agora, agora }),
    false,
  );
});
