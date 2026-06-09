import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { avaliarEstabilidadeMigracaoRelampago } from "./avaliar-estabilidade-migracao-relampago";

const entradaEstavel = {
  precoCalculadoEncontrado: true,
  oficialAtiva: true,
  regraOficialAplicadaId: "regra-oficial",
  regraMigradaId: "regra-oficial",
  modalidadeOficial: "dropshipping",
  modalidadeMigrada: "dropshipping",
  precoOficialEmCentavos: 37900,
  precoLegadoEmCentavos: 37900,
  countdownOficialIso: "2026-06-05T02:00:00.000Z",
  countdownLegadoIso: "2026-06-05T02:00:00.000Z",
  legadoUsado: false,
  stockSemPromocao: true,
};

describe("avaliarEstabilidadeMigracaoRelampago", () => {
  it("marca campanha migrada equivalente como estavel", () => {
    const resultado = avaliarEstabilidadeMigracaoRelampago(entradaEstavel);

    assert.equal(resultado.status, "estavel");
  });

  it("marca como instavel quando campanha oficial foi removida ou expirada", () => {
    const resultado = avaliarEstabilidadeMigracaoRelampago({
      ...entradaEstavel,
      oficialAtiva: false,
    });

    assert.equal(resultado.status, "instavel");
    assert.match(resultado.motivos.join(" "), /ausente ou inativa/);
  });

  it("marca como instavel quando preco oficial diverge do legado", () => {
    const resultado = avaliarEstabilidadeMigracaoRelampago({
      ...entradaEstavel,
      precoOficialEmCentavos: 38900,
    });

    assert.equal(resultado.status, "instavel");
    assert.match(resultado.motivos.join(" "), /Preço promocional/);
  });

  it("marca como instavel quando modalidade oficial diverge", () => {
    const resultado = avaliarEstabilidadeMigracaoRelampago({
      ...entradaEstavel,
      modalidadeOficial: "stock",
    });

    assert.equal(resultado.status, "instavel");
    assert.match(resultado.motivos.join(" "), /Modalidade oficial/);
  });

  it("marca como precisa_revisao quando stock nao existe para comparacao", () => {
    const resultado = avaliarEstabilidadeMigracaoRelampago({
      ...entradaEstavel,
      stockSemPromocao: null,
    });

    assert.equal(resultado.status, "precisa_revisao");
  });
});
