import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizarCepCliente,
  resolverCepCliente,
  resolverCepEnderecoCliente,
} from "./cep-cliente";

describe("contexto de CEP logístico", () => {
  it("normaliza o CEP antes do uso", () => {
    assert.equal(normalizarCepCliente("30.140-071"), "30140071");
  });

  it("prioriza manual, endereço e carrinho nessa ordem", () => {
    assert.deepEqual(
      resolverCepCliente({
        cepManual: "30140-071",
        cepEndereco: "31270-000",
        cepCarrinho: "31750-000",
      }),
      { cep: "30140071", origem: "manual" },
    );
    assert.deepEqual(
      resolverCepCliente({
        cepEndereco: "31270-000",
        cepCarrinho: "31750-000",
      }),
      { cep: "31270000", origem: "endereco" },
    );
    assert.deepEqual(resolverCepCliente({ cepCarrinho: "31750-000" }), {
      cep: "31750000",
      origem: "carrinho",
    });
  });

  it("não retorna CEP quando nenhum candidato é válido", () => {
    assert.deepEqual(resolverCepCliente({ cepEndereco: "123" }), {
      cep: "",
      origem: null,
    });
  });

  it("após logout ignora o endereço privado e mantém manual ou carrinho", () => {
    assert.deepEqual(
      resolverCepCliente({
        cepManual: "30140-071",
        cepEndereco: null,
        cepCarrinho: "31750-000",
      }),
      { cep: "30140071", origem: "manual" },
    );
    assert.deepEqual(
      resolverCepCliente({ cepEndereco: null, cepCarrinho: "31750-000" }),
      { cep: "31750000", origem: "carrinho" },
    );
  });

  it("prioriza endereço selecionado, principal e padrão legado", () => {
    assert.equal(
      resolverCepEnderecoCliente({
        cepSelecionado: "30610-000",
        cepPrincipal: "30140-071",
        cepPadrao: "31270-000",
      }),
      "30610000",
    );
    assert.equal(
      resolverCepEnderecoCliente({
        cepPrincipal: "30140-071",
        cepPadrao: "31270-000",
      }),
      "30140071",
    );
  });
});
