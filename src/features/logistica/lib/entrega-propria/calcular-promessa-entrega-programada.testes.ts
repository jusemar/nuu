import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularPromessaEntregaProgramada } from "./calcular-promessa-entrega-programada";
import { calcularPromessaEntregaPropria } from "./calcular-promessa-entrega-propria";

const agenda = {
  ativa: true,
  diasDaSemana: [1, 3, 5],
  horarioCorte: "13:00",
};

describe("calcular promessa da Entrega Programada", () => {
  it("cenário A: separa rápida após o corte da programada com três dias", () => {
    const dataReferencia = new Date("2026-07-27T17:00:00.000Z");
    const rapida = calcularPromessaEntregaPropria({ agenda, dataReferencia });
    const programada = calcularPromessaEntregaProgramada({
      agenda,
      prazoMinimoEmDiasCorridos: 3,
      dataReferencia,
    });

    assert.equal(rapida?.dataPrometida, "2026-07-29");
    assert.equal(programada?.dataPrometida, "2026-07-31");
  });

  it("cenário B: rápida entrega hoje antes do corte e programada respeita o prazo", () => {
    const dataReferencia = new Date("2026-07-27T12:00:00.000Z");
    const rapida = calcularPromessaEntregaPropria({ agenda, dataReferencia });
    const programada = calcularPromessaEntregaProgramada({
      agenda,
      prazoMinimoEmDiasCorridos: 3,
      dataReferencia,
    });

    assert.equal(rapida?.texto, "Entrega hoje");
    assert.equal(programada?.dataPrometida, "2026-07-31");
  });

  it("cenário C: em dia não atendido cada modalidade parte da própria regra", () => {
    const dataReferencia = new Date("2026-07-28T15:00:00.000Z");
    const rapida = calcularPromessaEntregaPropria({ agenda, dataReferencia });
    const programada = calcularPromessaEntregaProgramada({
      agenda,
      prazoMinimoEmDiasCorridos: 3,
      dataReferencia,
    });

    assert.equal(rapida?.dataPrometida, "2026-07-29");
    assert.equal(programada?.dataPrometida, "2026-07-31");
  });

  it("cenário D: ambas pulam uma data operacional bloqueada", () => {
    const dataReferencia = new Date("2026-07-27T17:00:00.000Z");
    const datasBloqueadas = ["2026-07-29"];
    const rapida = calcularPromessaEntregaPropria({
      agenda,
      dataReferencia,
      feriados: datasBloqueadas,
    });
    const programada = calcularPromessaEntregaProgramada({
      agenda,
      prazoMinimoEmDiasCorridos: 2,
      dataReferencia,
      datasBloqueadas,
    });

    assert.equal(rapida?.dataPrometida, "2026-07-31");
    assert.equal(programada?.dataPrometida, "2026-07-31");
  });

  it("soma dias corridos e ajusta para o primeiro dia atendido", () => {
    const resultado = calcularPromessaEntregaProgramada({
      agenda,
      prazoMinimoEmDiasCorridos: 3,
      dataReferencia: new Date("2026-07-27T12:00:00.000Z"),
    });

    assert.equal(resultado?.dataPrometida, "2026-07-31");
    assert.equal(resultado?.texto, "Receba sexta-feira");
  });

  it("ignora o horário de corte", () => {
    const antes = calcularPromessaEntregaProgramada({
      agenda,
      prazoMinimoEmDiasCorridos: 2,
      dataReferencia: new Date("2026-07-27T15:59:00.000Z"),
    });
    const depois = calcularPromessaEntregaProgramada({
      agenda,
      prazoMinimoEmDiasCorridos: 2,
      dataReferencia: new Date("2026-07-27T18:00:00.000Z"),
    });

    assert.equal(antes?.dataPrometida, "2026-07-29");
    assert.equal(depois?.dataPrometida, "2026-07-29");
  });

  it("atravessa fim de semana e virada de mês", () => {
    const resultado = calcularPromessaEntregaProgramada({
      agenda: { ...agenda, diasDaSemana: [1] },
      prazoMinimoEmDiasCorridos: 3,
      dataReferencia: new Date("2026-07-30T12:00:00.000Z"),
    });

    assert.equal(resultado?.dataPrometida, "2026-08-03");
  });

  it("não promete sem agenda ativa", () => {
    assert.equal(
      calcularPromessaEntregaProgramada({
        agenda: { ...agenda, ativa: false },
        prazoMinimoEmDiasCorridos: 3,
      }),
      null,
    );
  });
});
