import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { erroTabelaLogisticaAusente } from "./erro-tabela-logistica-ausente";

describe("erro tabela logística ausente", () => {
  it("detecta ausência de servicos_frete", () => {
    const erro = new Error('relation "servicos_frete" does not exist');
    assert.equal(erroTabelaLogisticaAusente(erro), true);
  });

  it("não marca erro sem relação com tabela", () => {
    const erro = new Error("timeout na conexão");
    assert.equal(erroTabelaLogisticaAusente(erro), false);
  });
});
