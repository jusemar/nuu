import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapearCatalogoFrenet } from "./mapear-catalogo-frenet";

describe("mapear catálogo Frenet", () => {
  it("organiza transportadoras e serviços retornados na cotação", () => {
    const catalogo = mapearCatalogoFrenet([
      {
        identificador: "frenet:teste:pac",
        provedor: "frenet",
        servico: "PAC",
        nome: "PAC",
        tipo: "entrega",
        valorEmCentavos: 1290,
        metadados: { transportadora: "Correios" },
      },
      {
        identificador: "frenet:teste:sedex",
        provedor: "frenet",
        servico: "SEDEX",
        nome: "SEDEX",
        tipo: "entrega",
        valorEmCentavos: 2290,
        metadados: { transportadora: "Correios" },
      },
    ]);

    assert.deepEqual(catalogo.transportadoras, [
      { identificador: "correios", nome: "Correios" },
    ]);
    assert.equal(catalogo.servicos.length, 2);
  });

  it("não cria catálogo sem transportadora real retornada", () => {
    const catalogo = mapearCatalogoFrenet([
      {
        identificador: "frenet:teste:pac",
        provedor: "frenet",
        servico: "PAC",
        nome: "PAC",
        tipo: "entrega",
        valorEmCentavos: 1290,
        metadados: {},
      },
    ]);

    assert.deepEqual(catalogo, { transportadoras: [], servicos: [] });
  });
});
