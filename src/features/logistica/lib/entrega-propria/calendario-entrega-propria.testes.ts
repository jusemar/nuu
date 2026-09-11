import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  avancarJanelasAtendidas,
  calcularProximaRevalidacaoEntregaPropria,
} from "./calendario-entrega-propria";

describe("avanço por janelas da Entrega Própria", () => {
  it("mantém a base em zero e avança somente por dias configurados", () => {
    assert.equal(
      avancarJanelasAtendidas({
        dataBaseIso: "2026-07-27",
        quantidadeJanelas: 0,
        diasAtendidos: [1, 3, 5],
      })?.dataIso,
      "2026-07-27",
    );
    assert.equal(
      avancarJanelasAtendidas({
        dataBaseIso: "2026-07-27",
        quantidadeJanelas: 3,
        diasAtendidos: [1, 3, 5],
      })?.dataIso,
      "2026-08-03",
    );
  });

  it("não conta datas bloqueadas como janelas", () => {
    assert.equal(
      avancarJanelasAtendidas({
        dataBaseIso: "2026-07-27",
        quantidadeJanelas: 1,
        diasAtendidos: [1, 3, 5],
        datasBloqueadas: ["2026-07-29"],
      })?.dataIso,
      "2026-07-31",
    );
  });
});

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
