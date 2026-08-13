import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularProximaRevalidacaoEntregaPropria } from "./calendario-entrega-propria";

describe("revalidação temporal da Entrega Própria", () => {
  it("agenda exatamente a passagem do corte", () => {
    const resultado = calcularProximaRevalidacaoEntregaPropria({
      dataReferencia: new Date("2026-07-29T15:59:00.000Z"),
      horarioCorte: "13:00",
    });

    assert.equal(resultado.toISOString(), "2026-07-29T16:00:00.000Z");
  });

  it("após o corte agenda a virada do dia", () => {
    const resultado = calcularProximaRevalidacaoEntregaPropria({
      dataReferencia: new Date("2026-07-29T17:00:00.000Z"),
      horarioCorte: "13:00",
    });

    assert.equal(resultado.toISOString(), "2026-07-30T03:00:00.000Z");
  });
});
