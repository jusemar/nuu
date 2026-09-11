import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularPromessaEntregaProgramada } from "./calcular-promessa-entrega-programada";
import { calcularPromessaEntregaPropria } from "./calcular-promessa-entrega-propria";

const agenda = {
  ativa: true,
  diasDaSemana: [1, 3, 5],
  horarioCorte: "13:00",
};

function calcularModalidades({
  dataReferencia,
  quantidadeJanelas,
  diasDaSemana = agenda.diasDaSemana,
  datasBloqueadas = [],
}: {
  dataReferencia: string;
  quantidadeJanelas: number;
  diasDaSemana?: number[];
  datasBloqueadas?: string[];
}) {
  const agendaDoCenario = { ...agenda, diasDaSemana };
  const instante = new Date(dataReferencia);
  const promessaRapida = calcularPromessaEntregaPropria({
    agenda: agendaDoCenario,
    dataReferencia: instante,
    feriados: datasBloqueadas,
  });
  const promessaProgramada = calcularPromessaEntregaProgramada({
    agenda: agendaDoCenario,
    promessaRapida,
    quantidadeJanelasAposRapida: quantidadeJanelas,
    dataReferencia: instante,
    datasBloqueadas,
  });

  return { promessaRapida, promessaProgramada };
}

describe("calcular promessa da Entrega Programada", () => {
  it("trata a promessa rápida como janela zero", () => {
    const resultado = calcularModalidades({
      dataReferencia: "2026-07-27T12:00:00.000Z",
      quantidadeJanelas: 0,
    });
    assert.equal(resultado.promessaRapida?.dataPrometida, "2026-07-27");
    assert.equal(resultado.promessaProgramada?.dataPrometida, "2026-07-27");
  });

  it("avança uma janela depois da rápida de segunda-feira", () => {
    const resultado = calcularModalidades({
      dataReferencia: "2026-07-27T12:00:00.000Z",
      quantidadeJanelas: 1,
    });
    assert.equal(resultado.promessaRapida?.dataPrometida, "2026-07-27");
    assert.equal(resultado.promessaProgramada?.dataPrometida, "2026-07-29");
  });

  for (const [quantidade, dataProgramada] of [
    [1, "2026-08-05"],
    [2, "2026-08-07"],
    [3, "2026-08-10"],
  ] as const) {
    it(`sexta após o corte: avança ${quantidade} janela(s) depois da rápida`, () => {
      const resultado = calcularModalidades({
        dataReferencia: "2026-07-31T17:00:00.000Z",
        quantidadeJanelas: quantidade,
      });
      assert.equal(resultado.promessaRapida?.dataPrometida, "2026-08-03");
      assert.equal(resultado.promessaProgramada?.dataPrometida, dataProgramada);
    });
  }

  it("quarta antes do corte avança para sexta com prazo um", () => {
    const resultado = calcularModalidades({
      dataReferencia: "2026-07-29T15:00:00.000Z",
      quantidadeJanelas: 1,
    });
    assert.equal(resultado.promessaRapida?.dataPrometida, "2026-07-29");
    assert.equal(resultado.promessaProgramada?.dataPrometida, "2026-07-31");
  });

  it("respeita quaisquer dias configurados", () => {
    const resultado = calcularModalidades({
      dataReferencia: "2026-07-27T12:00:00.000Z",
      quantidadeJanelas: 2,
      diasDaSemana: [2, 4],
    });
    assert.equal(resultado.promessaRapida?.dataPrometida, "2026-07-28");
    assert.equal(resultado.promessaProgramada?.dataPrometida, "2026-08-04");
  });

  it("pula uma janela bloqueada sem perder a contagem", () => {
    const resultado = calcularModalidades({
      dataReferencia: "2026-07-27T12:00:00.000Z",
      quantidadeJanelas: 2,
      datasBloqueadas: ["2026-07-29"],
    });
    assert.equal(resultado.promessaRapida?.dataPrometida, "2026-07-27");
    assert.equal(resultado.promessaProgramada?.dataPrometida, "2026-08-03");
  });

  it("não reaplica o corte depois de receber a promessa rápida", () => {
    const antes = calcularModalidades({
      dataReferencia: "2026-07-28T15:59:00.000Z",
      quantidadeJanelas: 1,
    });
    const depois = calcularModalidades({
      dataReferencia: "2026-07-28T18:00:00.000Z",
      quantidadeJanelas: 1,
    });
    assert.equal(antes.promessaRapida?.dataPrometida, "2026-07-29");
    assert.equal(depois.promessaRapida?.dataPrometida, "2026-07-29");
    assert.equal(antes.promessaProgramada?.dataPrometida, "2026-07-31");
    assert.equal(depois.promessaProgramada?.dataPrometida, "2026-07-31");
  });

  it("não promete sem agenda ativa ou sem promessa rápida", () => {
    assert.equal(
      calcularPromessaEntregaProgramada({
        agenda: { ...agenda, ativa: false },
        promessaRapida: null,
        quantidadeJanelasAposRapida: 1,
      }),
      null,
    );
  });
});
