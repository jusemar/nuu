import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularOfertaEntregaPropria } from "@/features/logistica/lib/entrega-propria/calcular-oferta-entrega-propria";
import { identificarGeografiaEntregaPropria } from "@/features/logistica/lib/entrega-propria/identificar-geografia-entrega-propria";

import { montarDestinosEntregaPropria } from "./montar-destinos-entrega-propria";
import { montarItensAgendaGeografica } from "./montar-itens-agenda-geografica";

const BH = { id: 4, name: "Belo Horizonte", stateUf: "MG" };
const regiao = (id: number, name: string, faixa?: [string, string]) => ({
  id,
  name,
  city: BH.name,
  state: "MG",
  cityId: BH.id,
  isActive: true,
  cepRanges: faixa
    ? [{ cepStart: faixa[0], cepEnd: faixa[1], isActive: true }]
    : [],
});
const BARREIRO = regiao(5, "Regional Barreiro", ["30600000", "30699999"]);
const OESTE = regiao(11, "Regional Oeste");
const NOROESTE = regiao(9, "Regional Noroeste");

const agendaBase = {
  cidadeId: null,
  regiaoId: null,
  bairroId: null,
  cepEspecificoId: null,
};
const AGENDAS = [
  {
    ...agendaBase,
    id: "a1",
    tipoDestino: "cidade" as const,
    cidadeId: BH.id,
    diasAtendidos: [1, 3, 5],
    horarioCorte: "13:00",
  },
  {
    ...agendaBase,
    id: "a2",
    tipoDestino: "regiao" as const,
    regiaoId: BARREIRO.id,
    diasAtendidos: [1, 3, 5],
    horarioCorte: "12:00",
  },
  {
    ...agendaBase,
    id: "a3",
    tipoDestino: "bairro" as const,
    bairroId: 71,
    diasAtendidos: [2, 4],
    horarioCorte: "11:00",
  },
];

function montar() {
  return montarDestinosEntregaPropria({
    cidades: [BH],
    regioes: [BARREIRO, OESTE, NOROESTE],
    bairros: [
      { id: 70, nome: "Gutierrez", cidadeId: BH.id, cidade: BH, regiao: OESTE },
      { id: 71, nome: "Buritis", cidadeId: BH.id, cidade: BH, regiao: OESTE },
    ],
    ceps: [
      {
        id: 1,
        cep: "30668635",
        neighborhood: "Vila Santa Rita (Barreiro)",
        city: "BELO HORIZONTE",
        state: "MG",
        bairroEnderecoCadastrado: "Santa Rita (Barreiro)",
      },
    ],
    agendas: AGENDAS,
  });
}

function agendaDe(type: string, id: number) {
  return montar().find((item) => item.type === type && item.id === id)
    ?.agendaEntrega;
}

describe("destinos da Entrega Própria no Admin", () => {
  it("mostra origem e herança por nível", () => {
    assert.equal(agendaDe("cidade", BH.id)?.origem, "Cidade: Belo Horizonte");
    assert.equal(
      agendaDe("region", BARREIRO.id)?.origem,
      "Região: Regional Barreiro",
    );
    assert.equal(
      agendaDe("region", OESTE.id)?.origem,
      "Cidade: Belo Horizonte",
    );
    assert.equal(agendaDe("region", NOROESTE.id)?.nivel, "cidade");
    assert.equal(agendaDe("bairro", 70)?.nivel, "cidade");
    assert.equal(agendaDe("bairro", 71)?.origem, "Bairro: Buritis");
    // CEP sem agenda própria herda a região da faixa (Barreiro).
    assert.equal(
      agendaDe("cep-especifico", 1)?.origem,
      "Região: Regional Barreiro",
    );
  });

  it("link leva à Agenda Geográfica filtrada na origem", () => {
    assert.equal(
      agendaDe("region", OESTE.id)?.configuracaoHref,
      "/admin/logistics/entrega-propria/agenda?nivel=cidade&busca=Belo+Horizonte",
    );
  });

  it("resolve a MESMA agenda que o motor público para cada destino", () => {
    const casos = [
      { type: "region", id: BARREIRO.id, geo: { regiaoFaixaCep: BARREIRO } },
      { type: "region", id: OESTE.id, geo: { regiaoFaixaCep: OESTE } },
      { type: "bairro", id: 70, geo: { regiaoBairro: OESTE, bairroId: 70 } },
      { type: "bairro", id: 71, geo: { regiaoBairro: OESTE, bairroId: 71 } },
      {
        type: "cep-especifico",
        id: 1,
        geo: { regiaoFaixaCep: BARREIRO, cepEspecificoId: 1 },
      },
    ];
    for (const caso of casos) {
      const { ids } = identificarGeografiaEntregaPropria({
        cidadeId: BH.id,
        ...caso.geo,
      });
      const oferta = calcularOfertaEntregaPropria({
        ids,
        agendas: AGENDAS.map((agenda) => ({ ...agenda, datasBloqueadas: [] })),
        // Preço na cidade apenas para habilitar o cálculo público.
        precos: [
          {
            destinationType: "cidade",
            cityId: BH.id,
            shippingPrice: 1000,
            rapidDeliveryActive: true,
            deliveryDeadline: null,
            scheduledDeliveryActive: false,
            scheduledDeliveryMinDays: null,
            scheduledDeliveryPrice: null,
          },
        ],
      });
      const admin = agendaDe(caso.type, caso.id);
      assert.ok(oferta.disponivel, `${caso.type}:${caso.id}`);
      assert.equal(admin?.nivel, oferta.nivelAgenda, `${caso.type}:${caso.id}`);
      assert.deepEqual(admin?.diasDaSemana, oferta.agenda.diasAtendidos);
      assert.equal(admin?.horarioCorte, oferta.agenda.horarioCorte);
    }
  });

  it("lista Agenda Geográfica com agenda própria, herdada e busca", () => {
    const destinos = montar();
    const agendas = AGENDAS.map((agenda) => ({
      ...agenda,
      datasBloqueadas: [],
    }));
    const regioes = montarItensAgendaGeografica({
      nivel: "regiao",
      destinos,
      agendas,
    });
    const barreiro = regioes.itens.find(
      (item) => item.destinoId === BARREIRO.id,
    );
    const oeste = regioes.itens.find((item) => item.destinoId === OESTE.id);

    assert.equal(regioes.totalItens, 3);
    assert.ok(barreiro?.agendaPropria);
    assert.equal(oeste?.agendaPropria, null);
    assert.equal(oeste?.agendaEfetiva?.origem, "Cidade: Belo Horizonte");

    const busca = montarItensAgendaGeografica({
      nivel: "regiao",
      destinos,
      agendas,
      busca: "noroeste",
    });
    assert.deepEqual(
      busca.itens.map((item) => item.destinoId),
      [NOROESTE.id],
    );
  });
});
