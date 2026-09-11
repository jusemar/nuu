import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  criarChaveDestinoEntregaPropria,
  type DestinoPesquisavelEntregaPropria,
  filtrarDestinosEntregaPropria,
} from "./pesquisar-destinos-entrega-propria";

const destinos: DestinoPesquisavelEntregaPropria[] = [
  {
    type: "cidade",
    id: 4,
    label: "Belo Horizonte",
    city: "Belo Horizonte",
    state: "MG",
  },
  {
    type: "cidade",
    id: 8,
    label: "Contagem",
    city: "Contagem",
    state: "MG",
  },
  {
    type: "region",
    id: 6,
    label: "Centro-Sul",
    city: "Belo Horizonte",
    state: "MG",
  },
  {
    type: "bairro-avulso",
    id: 12,
    label: "São Pedro",
    city: "Belo Horizonte",
    state: "MG",
  },
  {
    type: "cep-especifico",
    id: 20,
    label: "30100-939 - Barro Preto",
    city: "Belo Horizonte",
    state: "MG",
  },
];

describe("pesquisa de destinos da Entrega Propria", () => {
  it("encontra cidades progressivamente e sem diferenciar caixa", () => {
    assert.deepEqual(
      filtrarDestinosEntregaPropria(destinos, "belo").map(
        (destino) => destino.id,
      ),
      [4, 6, 12, 20],
    );
    assert.deepEqual(
      filtrarDestinosEntregaPropria(destinos, "CONT").map(
        (destino) => destino.id,
      ),
      [8],
    );
  });

  it("ignora acentos e pesquisa regiao e bairro pelo texto apresentado", () => {
    assert.deepEqual(
      filtrarDestinosEntregaPropria(destinos, "sao pedro").map(
        (destino) => destino.id,
      ),
      [12],
    );
    assert.deepEqual(
      filtrarDestinosEntregaPropria(destinos, "centro sul").map(
        (destino) => destino.id,
      ),
      [6],
    );
  });

  it("encontra CEP com ou sem hifen", () => {
    assert.deepEqual(
      filtrarDestinosEntregaPropria(destinos, "30100-939").map(
        (destino) => destino.id,
      ),
      [20],
    );
    assert.deepEqual(
      filtrarDestinosEntregaPropria(destinos, "30100939").map(
        (destino) => destino.id,
      ),
      [20],
    );
  });

  it("retorna estado vazio e preserva o identificador tecnico selecionado", () => {
    assert.deepEqual(
      filtrarDestinosEntregaPropria(destinos, "inexistente"),
      [],
    );
    assert.equal(criarChaveDestinoEntregaPropria(destinos[0]!), "cidade:4");
    assert.equal(
      criarChaveDestinoEntregaPropria(destinos[4]!),
      "cep-especifico:20",
    );
  });
});
