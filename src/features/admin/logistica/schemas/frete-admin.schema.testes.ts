import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  alternarAtivacaoSchema,
  criarProvedorFreteSchema,
  criarServicoFreteSchema,
  criarTransportadoraFreteSchema,
  editarProvedorFreteSchema,
} from "./frete-admin.schema";

describe("schemas admin frete fase 1", () => {
  it("valida criacao de provedor", () => {
    const resultado = criarProvedorFreteSchema.safeParse({
      identificador: "frenet",
      nome: "Frenet",
    });

    assert.equal(resultado.success, true);
  });

  it("valida edicao parcial de provedor", () => {
    const resultado = editarProvedorFreteSchema.safeParse({
      nome: "Frenet Atualizado",
    });

    assert.equal(resultado.success, true);
  });

  it("valida ativacao e desativacao", () => {
    const ativo = alternarAtivacaoSchema.safeParse({ ativo: true });
    const inativo = alternarAtivacaoSchema.safeParse({ ativo: false });

    assert.equal(ativo.success, true);
    assert.equal(inativo.success, true);
  });

  it("bloqueia criacao de transportadora sem provedor", () => {
    const resultado = criarTransportadoraFreteSchema.safeParse({
      identificador: "jadlog",
      nome: "Jadlog",
    });

    assert.equal(resultado.success, false);
  });

  it("bloqueia criacao de servico sem identificador", () => {
    const resultado = criarServicoFreteSchema.safeParse({
      provedorFreteId: "a8d4d8eb-6cea-4a33-a13b-df22b904fb91",
      nome: "Expresso",
    });

    assert.equal(resultado.success, false);
  });
});

