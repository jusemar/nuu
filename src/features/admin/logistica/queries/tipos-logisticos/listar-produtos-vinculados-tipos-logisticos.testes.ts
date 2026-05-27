import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { erroTabelaVinculoAusente } from "@/features/admin/logistica/lib/erro-tabela-vinculo-ausente";

describe("listar produtos vinculados tipos logísticos", () => {
  it("identifica erro de tabela ausente", () => {
    const erro = new Error('relation "produtos_tipos_logisticos" does not exist');
    assert.equal(erroTabelaVinculoAusente(erro), true);
  });

  it("não marca erro comum como tabela ausente", () => {
    const erro = new Error("timeout em consulta");
    assert.equal(erroTabelaVinculoAusente(erro), false);
  });
});
