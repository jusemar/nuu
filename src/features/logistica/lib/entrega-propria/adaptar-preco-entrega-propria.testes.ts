import assert from "node:assert/strict";
import test from "node:test";

import { adaptarPrecoEntregaPropriaParaHierarquia } from "./adaptar-preco-entrega-propria";

test("traduz os quatro níveis físicos para a hierarquia canônica", () => {
  const casos = [
    {
      entrada: { destinationType: "cidade", cityId: 1 },
      tipoDestino: "cidade",
      id: 1,
      campo: "cidadeId",
    },
    {
      entrada: { destinationType: "region", regionId: 2 },
      tipoDestino: "regiao",
      id: 2,
      campo: "regiaoId",
    },
    {
      entrada: { destinationType: "bairro", bairroId: 3 },
      tipoDestino: "bairro",
      id: 3,
      campo: "bairroId",
    },
    {
      entrada: { destinationType: "cep-especifico", cepEspecificoId: 4 },
      tipoDestino: "cep",
      id: 4,
      campo: "cepEspecificoId",
    },
  ] as const;

  for (const caso of casos) {
    const resultado = adaptarPrecoEntregaPropriaParaHierarquia(caso.entrada);
    assert.equal(resultado.tipoDestino, caso.tipoDestino);
    assert.equal(resultado[caso.campo], caso.id);
  }
});

test("rejeita o antigo marcador bairro-avulso, removido do modelo", () => {
  assert.throws(
    () =>
      adaptarPrecoEntregaPropriaParaHierarquia({
        destinationType: "bairro-avulso",
        bairroId: 9,
      }),
    /Tipo de destino de Entrega Própria inválido/,
  );
});

test("não interpreta tipo desconhecido como cidade", () => {
  assert.throws(
    () =>
      adaptarPrecoEntregaPropriaParaHierarquia({
        destinationType: "destino-invalido",
      }),
    /Tipo de destino de Entrega Própria inválido/,
  );
});
