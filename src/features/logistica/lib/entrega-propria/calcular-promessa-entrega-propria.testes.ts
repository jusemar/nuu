import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularPromessaEntregaPropria } from "./calcular-promessa-entrega-propria";

const agendaSegundaQuarta = {
  ativa: true,
  diasDaSemana: [1, 3],
  horarioCorte: "13:00",
};

describe("calcular promessa da Entrega Própria", () => {
  it("entrega hoje em dia atendido antes do corte", () => {
    const resultado = calcularPromessaEntregaPropria({
      agenda: agendaSegundaQuarta,
      dataReferencia: new Date("2026-07-22T15:59:00.000Z"),
    });
    assert.equal(resultado?.texto, "Entrega hoje");
    assert.equal(
      resultado?.observacaoPagamento,
      "Para pedidos com pagamento aprovado até 13:00.",
    );
  });

  it("considera o horário exato do corte como encerrado", () => {
    const resultado = calcularPromessaEntregaPropria({
      agenda: agendaSegundaQuarta,
      dataReferencia: new Date("2026-07-22T16:00:00.000Z"),
    });
    assert.equal(resultado?.dataPrometida, "2026-07-27");
  });

  it("avança para a próxima semana após o corte", () => {
    const resultado = calcularPromessaEntregaPropria({
      agenda: agendaSegundaQuarta,
      dataReferencia: new Date("2026-07-22T17:00:00.000Z"),
    });
    assert.equal(resultado?.texto, "Entrega segunda-feira");
    assert.equal(resultado?.observacaoPagamento, null);
  });

  it("usa o próximo dia atendido quando hoje não é atendido", () => {
    const resultado = calcularPromessaEntregaPropria({
      agenda: agendaSegundaQuarta,
      dataReferencia: new Date("2026-07-21T18:00:00.000Z"),
    });
    assert.equal(resultado?.texto, "Entrega amanhã");
  });

  it("ignora o corte em um dia não atendido", () => {
    const antes = calcularPromessaEntregaPropria({
      agenda: agendaSegundaQuarta,
      dataReferencia: new Date("2026-07-21T14:00:00.000Z"),
    });
    const depois = calcularPromessaEntregaPropria({
      agenda: agendaSegundaQuarta,
      dataReferencia: new Date("2026-07-21T20:00:00.000Z"),
    });
    assert.equal(antes?.dataPrometida, "2026-07-22");
    assert.equal(depois?.dataPrometida, "2026-07-22");
  });

  it("atravessa sábado e domingo", () => {
    const resultado = calcularPromessaEntregaPropria({
      agenda: { ...agendaSegundaQuarta, diasDaSemana: [1] },
      dataReferencia: new Date("2026-07-24T18:00:00.000Z"),
    });
    assert.equal(resultado?.dataPrometida, "2026-07-27");
  });

  it("atravessa a virada do mês", () => {
    const resultado = calcularPromessaEntregaPropria({
      agenda: { ...agendaSegundaQuarta, diasDaSemana: [1] },
      dataReferencia: new Date("2026-07-31T18:00:00.000Z"),
    });
    assert.equal(resultado?.dataPrometida, "2026-08-03");
  });

  it("atravessa a virada do ano", () => {
    const resultado = calcularPromessaEntregaPropria({
      agenda: { ...agendaSegundaQuarta, diasDaSemana: [5] },
      dataReferencia: new Date("2026-12-31T18:00:00.000Z"),
    });
    assert.equal(resultado?.dataPrometida, "2027-01-01");
  });

  it("não calcula agenda inativa", () => {
    assert.equal(
      calcularPromessaEntregaPropria({
        agenda: { ...agendaSegundaQuarta, ativa: false },
      }),
      null,
    );
  });

  it("não calcula região sem agenda", () => {
    assert.equal(calcularPromessaEntregaPropria({ agenda: null }), null);
  });

  it("não exige nem usa período de entrega para calcular a promessa", () => {
    const resultado = calcularPromessaEntregaPropria({
      agenda: {
        ...agendaSegundaQuarta,
        periodoInicio: "14:00",
        periodoFim: "18:00",
      },
      dataReferencia: new Date("2026-07-22T15:59:00.000Z"),
    });

    assert.equal(resultado?.texto, "Entrega hoje");
    assert.deepEqual(resultado?.periodoEntrega, {
      inicio: "14:00",
      fim: "18:00",
    });
  });

  it("usa America/Sao_Paulo ao comparar o corte", () => {
    const antes = calcularPromessaEntregaPropria({
      agenda: agendaSegundaQuarta,
      dataReferencia: new Date("2026-07-22T15:59:00.000Z"),
    });
    const noCorte = calcularPromessaEntregaPropria({
      agenda: agendaSegundaQuarta,
      dataReferencia: new Date("2026-07-22T16:00:00.000Z"),
    });
    assert.equal(antes?.timezone, "America/Sao_Paulo");
    assert.equal(antes?.dataPrometida, "2026-07-22");
    assert.equal(noCorte?.dataPrometida, "2026-07-27");
  });

  it("permite injetar feriados sem depender de calendário externo", () => {
    const resultado = calcularPromessaEntregaPropria({
      agenda: agendaSegundaQuarta,
      dataReferencia: new Date("2026-07-21T18:00:00.000Z"),
      feriados: ["2026-07-22"],
    });
    assert.equal(resultado?.dataPrometida, "2026-07-27");
    assert.equal(resultado?.feriadosConsiderados, true);
  });
});
