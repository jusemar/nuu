import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { agendaEntregaPropriaSchema } from "./agenda-entrega-propria.schema";

describe("validação da agenda de Entrega Própria", () => {
  it("aceita agenda regional válida e remove dias duplicados", () => {
    const resultado = agendaEntregaPropriaSchema.parse({
      ativa: true,
      diasDaSemana: [3, 1, 3],
      horarioCorte: "13:00",
    });

    assert.deepEqual(resultado.diasDaSemana, [1, 3]);
  });

  it("impede agenda ativa sem dia atendido", () => {
    const resultado = agendaEntregaPropriaSchema.safeParse({
      ativa: true,
      diasDaSemana: [],
      horarioCorte: "13:00",
    });

    assert.equal(resultado.success, false);
  });

  it("impede horário de corte inválido", () => {
    const resultado = agendaEntregaPropriaSchema.safeParse({
      ativa: true,
      diasDaSemana: [1],
      horarioCorte: "25:00",
    });
    assert.equal(resultado.success, false);
  });

  it("permite salvar dias com a agenda inativa para ativação futura", () => {
    const resultado = agendaEntregaPropriaSchema.safeParse({
      ativa: false,
      diasDaSemana: [],
      horarioCorte: "13:00",
    });
    assert.equal(resultado.success, true);
  });
});
