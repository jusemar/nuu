import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  type AgendaGeograficaParaCalculo,
  calcularOfertaEntregaPropria,
  type PrecoProdutoParaCalculo,
} from "./calcular-oferta-entrega-propria";
import { identificarGeografiaEntregaPropria } from "./identificar-geografia-entrega-propria";

// Cenário espelhado do banco atual: Belo Horizonte (cidade 4), regiões
// Barreiro (5), Pampulha (12), Oeste (11) e Noroeste (9).
const BH = 4;
const BARREIRO = { id: 5, cityId: BH, isActive: true };
const PAMPULHA = { id: 12, cityId: BH, isActive: true };
const OESTE = { id: 11, cityId: BH, isActive: true };
const NOROESTE = { id: 9, cityId: BH, isActive: true };

// 14/09/2026 é segunda-feira. 12:00Z = 09:00 em São Paulo (antes do corte)
// e 17:00Z = 14:00 em São Paulo (depois do corte das 13:00).
const SEGUNDA_ANTES_CORTE = new Date("2026-09-14T12:00:00.000Z");
const SEGUNDA_APOS_CORTE = new Date("2026-09-14T17:00:00.000Z");

function agenda(
  dados: Partial<AgendaGeograficaParaCalculo> &
    Pick<AgendaGeograficaParaCalculo, "tipoDestino">,
): AgendaGeograficaParaCalculo {
  return {
    id: `${dados.tipoDestino}-${dados.cidadeId ?? dados.regiaoId ?? dados.bairroId ?? dados.cepEspecificoId}`,
    diasAtendidos: [1, 3, 5],
    horarioCorte: "13:00",
    datasBloqueadas: [],
    ...dados,
  };
}

function preco(
  dados: Partial<PrecoProdutoParaCalculo> &
    Pick<PrecoProdutoParaCalculo, "destinationType">,
): PrecoProdutoParaCalculo {
  return {
    shippingPrice: 1000,
    rapidDeliveryActive: true,
    deliveryDeadline: null,
    scheduledDeliveryActive: true,
    scheduledDeliveryMinDays: 3,
    scheduledDeliveryPrice: 0,
    ...dados,
  };
}

// Agendas migradas: cidade BH Seg/Qua/Sex; Barreiro Seg/Qua/Sex; Pampulha Seg–Sex.
const AGENDAS = [
  agenda({ tipoDestino: "cidade", cidadeId: BH }),
  agenda({ tipoDestino: "regiao", regiaoId: BARREIRO.id }),
  agenda({
    tipoDestino: "regiao",
    regiaoId: PAMPULHA.id,
    diasAtendidos: [1, 2, 3, 4, 5],
  }),
];

// Preços migrados das antigas Políticas: cidade R$ 10, Barreiro R$ 7,
// Pampulha R$ 15; programada grátis com 3 janelas.
const PRECOS = [
  preco({ destinationType: "cidade", cityId: BH, shippingPrice: 1000 }),
  preco({
    destinationType: "region",
    regionId: BARREIRO.id,
    shippingPrice: 700,
  }),
  preco({
    destinationType: "region",
    regionId: PAMPULHA.id,
    shippingPrice: 1500,
  }),
];

function ofertaNaRegiao(
  regiao: typeof BARREIRO,
  {
    agendas = AGENDAS,
    precos = PRECOS,
    dataReferencia = SEGUNDA_ANTES_CORTE,
  }: {
    agendas?: AgendaGeograficaParaCalculo[];
    precos?: PrecoProdutoParaCalculo[];
    dataReferencia?: Date;
  } = {},
) {
  const { ids } = identificarGeografiaEntregaPropria({
    cidadeId: BH,
    regiaoFaixaCep: regiao,
  });
  return calcularOfertaEntregaPropria({ ids, agendas, precos, dataReferencia });
}

describe("motor único da Entrega Própria", () => {
  it("Barreiro usa agenda e preço regionais", () => {
    const oferta = ofertaNaRegiao(BARREIRO);
    assert.equal(oferta.disponivel, true);
    if (!oferta.disponivel) return;
    assert.equal(oferta.nivelAgenda, "regiao");
    assert.equal(oferta.nivelPreco, "regiao");
    assert.equal(oferta.valorRapidaEmCentavos, 700);
    assert.equal(oferta.promessaRapida?.dataPrometida, "2026-09-14");
  });

  it("Pampulha usa agenda Seg–Sex e preço regional", () => {
    const oferta = ofertaNaRegiao(PAMPULHA, {
      dataReferencia: SEGUNDA_APOS_CORTE,
    });
    assert.equal(oferta.disponivel, true);
    if (!oferta.disponivel) return;
    assert.equal(oferta.nivelAgenda, "regiao");
    assert.equal(oferta.valorRapidaEmCentavos, 1500);
    // Após o corte de segunda, a próxima data válida da Pampulha é terça.
    assert.equal(oferta.promessaRapida?.dataPrometida, "2026-09-15");
  });

  for (const [nome, regiao] of [
    ["Oeste", OESTE],
    ["Noroeste", NOROESTE],
  ] as const) {
    it(`${nome} sem agenda própria herda agenda e preço de Belo Horizonte`, () => {
      const oferta = ofertaNaRegiao(regiao);
      assert.equal(oferta.disponivel, true);
      if (!oferta.disponivel) return;
      assert.equal(oferta.nivelAgenda, "cidade");
      assert.equal(oferta.nivelPreco, "cidade");
      assert.equal(oferta.valorRapidaEmCentavos, 1000);
    });
  }

  it("Oeste com agenda própria passa a usar a agenda da região", () => {
    const oferta = ofertaNaRegiao(OESTE, {
      agendas: [
        ...AGENDAS,
        agenda({
          tipoDestino: "regiao",
          regiaoId: OESTE.id,
          diasAtendidos: [2, 4],
        }),
      ],
    });
    assert.equal(oferta.disponivel, true);
    if (!oferta.disponivel) return;
    assert.equal(oferta.nivelAgenda, "regiao");
    // Agenda e preço são independentes: preço continua vindo da cidade.
    assert.equal(oferta.nivelPreco, "cidade");
    assert.equal(oferta.promessaRapida?.dataPrometida, "2026-09-15");
  });

  it("aplica precedência CEP > Bairro > Região > Cidade para agenda e preço", () => {
    const agendas = [
      ...AGENDAS,
      agenda({ tipoDestino: "bairro", bairroId: 50, diasAtendidos: [2] }),
      agenda({ tipoDestino: "cep", cepEspecificoId: 70, diasAtendidos: [4] }),
    ];
    const precos = [
      ...PRECOS,
      preco({ destinationType: "bairro", bairroId: 50, shippingPrice: 500 }),
      preco({
        destinationType: "cep-especifico",
        cepEspecificoId: 70,
        shippingPrice: 300,
      }),
    ];
    const noBairro = identificarGeografiaEntregaPropria({
      cidadeId: BH,
      regiaoBairro: BARREIRO,
      bairroId: 50,
    });
    const noCep = identificarGeografiaEntregaPropria({
      cidadeId: BH,
      regiaoBairro: BARREIRO,
      bairroId: 50,
      cepEspecificoId: 70,
    });

    const ofertaBairro = calcularOfertaEntregaPropria({
      ids: noBairro.ids,
      agendas,
      precos,
      dataReferencia: SEGUNDA_ANTES_CORTE,
    });
    const ofertaCep = calcularOfertaEntregaPropria({
      ids: noCep.ids,
      agendas,
      precos,
      dataReferencia: SEGUNDA_ANTES_CORTE,
    });

    assert.ok(ofertaBairro.disponivel && ofertaCep.disponivel);
    assert.equal(ofertaBairro.nivelAgenda, "bairro");
    assert.equal(ofertaBairro.valorRapidaEmCentavos, 500);
    assert.equal(ofertaBairro.promessaRapida?.dataPrometida, "2026-09-15");
    assert.equal(ofertaCep.nivelAgenda, "cep");
    assert.equal(ofertaCep.valorRapidaEmCentavos, 300);
    assert.equal(ofertaCep.promessaRapida?.dataPrometida, "2026-09-17");
  });

  it("programada avança 0/1/2/3 próximas datas válidas (Seg/Qua/Sex)", () => {
    const esperado = ["2026-09-14", "2026-09-16", "2026-09-18", "2026-09-21"];
    esperado.forEach((dataEsperada, janelas) => {
      const oferta = ofertaNaRegiao(OESTE, {
        precos: [
          preco({
            destinationType: "cidade",
            cityId: BH,
            scheduledDeliveryMinDays: janelas,
          }),
        ],
      });
      assert.ok(oferta.disponivel);
      assert.equal(oferta.promessaRapida?.dataPrometida, "2026-09-14");
      assert.equal(
        oferta.entregaProgramada?.promessa.dataPrometida,
        dataEsperada,
      );
    });
  });

  it("corte vale só para a rápida; programada conta a partir dela", () => {
    const oferta = ofertaNaRegiao(OESTE, {
      dataReferencia: SEGUNDA_APOS_CORTE,
    });
    assert.ok(oferta.disponivel);
    // Após o corte: rápida na quarta; 3 janelas → sexta, segunda, quarta.
    assert.equal(oferta.promessaRapida?.dataPrometida, "2026-09-16");
    assert.equal(
      oferta.entregaProgramada?.promessa.dataPrometida,
      "2026-09-23",
    );
  });

  it("programada com R$ 0 é oferta válida (grátis) e independe da rápida", () => {
    const oferta = ofertaNaRegiao(BARREIRO, {
      precos: [
        preco({
          destinationType: "region",
          regionId: BARREIRO.id,
          shippingPrice: 700,
          scheduledDeliveryPrice: 0,
        }),
      ],
    });
    assert.ok(oferta.disponivel);
    assert.equal(oferta.valorRapidaEmCentavos, 700);
    assert.equal(oferta.entregaProgramada?.valorEmCentavos, 0);
  });

  it("rápida desativada mantém somente a programada", () => {
    const oferta = ofertaNaRegiao(BARREIRO, {
      precos: [
        preco({
          destinationType: "region",
          regionId: BARREIRO.id,
          rapidDeliveryActive: false,
        }),
      ],
    });
    assert.ok(oferta.disponivel);
    assert.equal(oferta.promessaRapida, null);
    assert.equal(oferta.valorRapidaEmCentavos, null);
    assert.equal(
      oferta.entregaProgramada?.promessa.dataPrometida,
      "2026-09-21",
    );
  });

  it("sem agenda em nenhum nível não oferece entrega", () => {
    const oferta = ofertaNaRegiao(OESTE, { agendas: [] });
    assert.deepEqual(oferta, { disponivel: false, motivo: "sem-agenda" });
  });

  it("sem preço do produto no destino não oferece entrega", () => {
    const oferta = ofertaNaRegiao(OESTE, { precos: [] });
    assert.deepEqual(oferta, { disponivel: false, motivo: "sem-preco" });
  });
});

describe("identificação geográfica compartilhada (Admin e loja)", () => {
  it("prioriza a região da faixa de CEP sobre a região do bairro", () => {
    const { ids } = identificarGeografiaEntregaPropria({
      cidadeId: BH,
      regiaoFaixaCep: PAMPULHA,
      regiaoBairro: BARREIRO,
    });
    assert.equal(ids.regiaoId, PAMPULHA.id);
  });

  it("ignora região inativa ou de outra cidade e herda a cidade", () => {
    const inativa = identificarGeografiaEntregaPropria({
      cidadeId: BH,
      regiaoBairro: { ...BARREIRO, isActive: false },
    });
    const outraCidade = identificarGeografiaEntregaPropria({
      cidadeId: BH,
      regiaoFaixaCep: { id: 14, cityId: 8, isActive: true },
    });
    assert.equal(inativa.ids.regiaoId, null);
    assert.equal(outraCidade.ids.regiaoId, null);
  });
});
