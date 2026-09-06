import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  pixEstaValidoParaPagamento,
  resolverEstadoVisualPix,
} from "./estado-pix";

const agora = new Date("2026-09-06T18:00:00.000Z");

describe("estado visual do Pix Efí", () => {
  it("mostra aguardando pagamento enquanto o Pix pendente é válido", () => {
    assert.equal(
      resolverEstadoVisualPix({
        status: "pending",
        expiresAt: "2026-09-06T18:00:01.000Z",
        agora,
      }),
      "aguardando_pagamento",
    );
  });

  it("deriva Pix expirado pela data real sem depender de mudança no banco", () => {
    assert.equal(
      resolverEstadoVisualPix({
        status: "pending",
        expiresAt: "2026-09-06T18:00:00.000Z",
        agora,
      }),
      "expirado",
    );
    assert.equal(
      pixEstaValidoParaPagamento({
        status: "pending",
        expiresAt: "2026-09-06T17:59:59.000Z",
        agora,
      }),
      false,
    );
  });

  it("prioriza os estados reais pago, falhou e expirado", () => {
    assert.equal(
      resolverEstadoVisualPix({ status: "paid", expiresAt: null, agora }),
      "pago",
    );
    assert.equal(
      resolverEstadoVisualPix({ status: "failed", expiresAt: null, agora }),
      "falhou",
    );
    assert.equal(
      resolverEstadoVisualPix({ status: "expired", expiresAt: null, agora }),
      "expirado",
    );
  });
});
