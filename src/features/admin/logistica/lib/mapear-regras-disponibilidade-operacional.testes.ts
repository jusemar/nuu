import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapearRegraDisponibilidadeOperacional } from "./mapear-regras-disponibilidade-operacional";

describe("mapear regras de disponibilidade operacional", () => {
  it("monta frase de categoria com transportadora e serviço", () => {
    const regra = mapearRegraDisponibilidadeOperacional(
      {
        id: "r1",
        efeito: "bloquear",
        ativo: true,
        provedorNome: "Frenet",
        transportadoraNome: "Correios",
        servicoNome: "PAC",
      },
      "categoria",
      "Colchões",
    );

    assert.equal(regra.frase, "Bloquear Correios PAC para categoria Colchões");
    assert.equal(regra.precedencia, "Base da categoria");
  });

  it("informa precedência de regra por produto", () => {
    const regra = mapearRegraDisponibilidadeOperacional(
      {
        id: "r2",
        efeito: "permitir",
        ativo: true,
        provedorNome: null,
        transportadoraNome: "Jadlog",
        servicoNome: null,
      },
      "produto",
      "Colchão Queen",
    );

    assert.equal(regra.frase, "Permitir Jadlog para produto Colchão Queen");
    assert.equal(regra.precedencia, "Sobrescreve categoria");
  });
});
