import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  type AgendaGeograficaParaCalculo,
  calcularOfertaEntregaPropria,
  type PrecoProdutoParaCalculo,
} from "./calcular-oferta-entrega-propria";
import { escolherFonteComercialEntregaPropria } from "./escolher-fonte-comercial-entrega-propria";
import { identificarGeografiaEntregaPropria } from "./identificar-geografia-entrega-propria";
import {
  modoEntregaPropriaDoProduto,
  resolverDisponibilidadeEntregaPropria,
} from "./resolver-disponibilidade-entrega-propria";

// Cenário espelhado do banco: Belo Horizonte (4), Barreiro (5), Oeste (11).
const BH = 4;
const BARREIRO = { id: 5, cityId: BH, isActive: true };
const OESTE = { id: 11, cityId: BH, isActive: true };
// 14/09/2026 (segunda), 09:00 em São Paulo — antes do corte das 13:00.
const SEGUNDA = new Date("2026-09-14T12:00:00.000Z");

const AGENDAS: AgendaGeograficaParaCalculo[] = [
  {
    id: "agenda-bh",
    tipoDestino: "cidade",
    cidadeId: BH,
    diasAtendidos: [1, 3, 5],
    horarioCorte: "13:00",
    datasBloqueadas: [],
  },
];

type Preco = PrecoProdutoParaCalculo & { isActive: boolean };

function preco(dados: Partial<Preco> & Pick<Preco, "destinationType">): Preco {
  return {
    shippingPrice: 1000,
    rapidDeliveryActive: true,
    deliveryDeadline: null,
    scheduledDeliveryActive: true,
    scheduledDeliveryMinDays: 3,
    scheduledDeliveryPrice: 0,
    isActive: true,
    ...dados,
  };
}

// Categoria Rações (filha) dentro de Pet Shop (pai).
const RACOES = { id: "cat-racoes", nome: "Rações" };
const PET = { id: "cat-pet", nome: "Pet Shop" };
const cidadeBH = (dados: Partial<Preco> = {}) =>
  preco({ destinationType: "cidade", cityId: BH, ...dados });

function ofertaPara({
  precosProduto = [],
  precosPorCategoriaId = new Map<string, Preco[]>(),
  cadeia = [RACOES, PET],
  regiao = OESTE,
}: {
  precosProduto?: Preco[];
  precosPorCategoriaId?: Map<string, Preco[]>;
  cadeia?: { id: string; nome: string }[];
  regiao?: typeof OESTE;
}) {
  const { ids } = identificarGeografiaEntregaPropria({
    cidadeId: BH,
    regiaoFaixaCep: regiao,
  });
  const fonte = escolherFonteComercialEntregaPropria({
    ids,
    precosProduto,
    cadeiaCategorias: cadeia,
    precosPorCategoriaId,
  });
  const oferta = calcularOfertaEntregaPropria({
    ids,
    agendas: AGENDAS,
    precos: fonte?.precos ?? [],
    dataReferencia: SEGUNDA,
  });
  return { fonte, oferta };
}

describe("Entrega Própria por Categoria — fonte comercial", () => {
  it("1. produto sem configuração própria herda a Categoria (BH R$10, programada grátis, 3 janelas)", () => {
    const { fonte, oferta } = ofertaPara({
      precosPorCategoriaId: new Map([[RACOES.id, [cidadeBH()]]]),
    });
    assert.deepEqual(fonte?.fonte, {
      tipo: "categoria",
      categoriaId: "cat-racoes",
      categoriaNome: "Rações",
    });
    assert.ok(oferta.disponivel);
    assert.equal(oferta.valorRapidaEmCentavos, 1000);
    // 6. R$ 0 é oferta válida (GRÁTIS), não ausência.
    assert.equal(oferta.entregaProgramada?.valorEmCentavos, 0);
    // Janelas: rápida segunda 14/09; 3 próximas datas válidas → segunda 21/09.
    assert.equal(oferta.promessaRapida?.dataPrometida, "2026-09-14");
    assert.equal(
      oferta.entregaProgramada?.promessa.dataPrometida,
      "2026-09-21",
    );
  });

  it("2. produto com BH R$7 vence a Categoria", () => {
    const { fonte, oferta } = ofertaPara({
      precosProduto: [cidadeBH({ shippingPrice: 700 })],
      precosPorCategoriaId: new Map([[RACOES.id, [cidadeBH()]]]),
    });
    assert.deepEqual(fonte?.fonte, { tipo: "produto" });
    assert.ok(oferta.disponivel);
    assert.equal(oferta.valorRapidaEmCentavos, 700);
  });

  it("3. categoria filha sem configuração herda o ancestral mais próximo", () => {
    const { fonte, oferta } = ofertaPara({
      precosPorCategoriaId: new Map([
        [PET.id, [cidadeBH({ shippingPrice: 1200 })]],
      ]),
    });
    assert.deepEqual(fonte?.fonte, {
      tipo: "categoria-ancestral",
      categoriaId: "cat-pet",
      categoriaNome: "Pet Shop",
    });
    assert.ok(oferta.disponivel);
    assert.equal(oferta.valorRapidaEmCentavos, 1200);
  });

  it("4. categoria filha com configuração vence o pai", () => {
    const { fonte, oferta } = ofertaPara({
      precosPorCategoriaId: new Map([
        [RACOES.id, [cidadeBH({ shippingPrice: 900 })]],
        [PET.id, [cidadeBH({ shippingPrice: 1200 })]],
      ]),
    });
    assert.equal(fonte?.fonte.tipo, "categoria");
    assert.ok(oferta.disponivel);
    assert.equal(oferta.valorRapidaEmCentavos, 900);
  });

  it("5. Categoria configura Região Oeste; dias/corte vêm da Agenda de Belo Horizonte", () => {
    const { fonte, oferta } = ofertaPara({
      precosPorCategoriaId: new Map([
        [
          RACOES.id,
          [
            cidadeBH(),
            preco({
              destinationType: "region",
              regionId: OESTE.id,
              shippingPrice: 850,
            }),
          ],
        ],
      ]),
    });
    assert.equal(fonte?.fonte.tipo, "categoria");
    assert.ok(oferta.disponivel);
    // Dentro da fonte escolhida: Região vence Cidade.
    assert.equal(oferta.nivelPreco, "regiao");
    assert.equal(oferta.valorRapidaEmCentavos, 850);
    assert.equal(oferta.nivelAgenda, "cidade");
    assert.deepEqual(oferta.agenda.diasAtendidos, [1, 3, 5]);
  });

  it("não mistura fontes: preço do produto em Barreiro não completa a programada com a Categoria", () => {
    const { fonte, oferta } = ofertaPara({
      regiao: BARREIRO,
      precosProduto: [
        preco({
          destinationType: "region",
          regionId: BARREIRO.id,
          shippingPrice: 700,
          scheduledDeliveryActive: false,
          scheduledDeliveryMinDays: null,
          scheduledDeliveryPrice: null,
        }),
      ],
      precosPorCategoriaId: new Map([[RACOES.id, [cidadeBH()]]]),
    });
    assert.deepEqual(fonte?.fonte, { tipo: "produto" });
    assert.ok(oferta.disponivel);
    assert.equal(oferta.entregaProgramada, null);
  });

  it("preço inativo do produto não bloqueia a Categoria", () => {
    const { fonte } = ofertaPara({
      precosProduto: [cidadeBH({ shippingPrice: 700, isActive: false })],
      precosPorCategoriaId: new Map([[RACOES.id, [cidadeBH()]]]),
    });
    assert.equal(fonte?.fonte.tipo, "categoria");
  });

  it("produto com preço só para outra região cai na Categoria para este endereço", () => {
    const { fonte } = ofertaPara({
      regiao: OESTE,
      precosProduto: [
        preco({ destinationType: "region", regionId: BARREIRO.id }),
      ],
      precosPorCategoriaId: new Map([[RACOES.id, [cidadeBH()]]]),
    });
    assert.equal(fonte?.fonte.tipo, "categoria");
  });

  it("7. sem configuração aplicável em nenhuma fonte não inventa Entrega Própria", () => {
    const { fonte, oferta } = ofertaPara({});
    assert.equal(fonte, null);
    assert.deepEqual(oferta, { disponivel: false, motivo: "sem-preco" });
  });
});

describe("Entrega Própria por Categoria — disponibilidade", () => {
  const cadeia = (
    modoRacoes: "herdar" | "ativado" | "desativado",
    modoPet = "herdar" as const,
  ) => [
    { ...RACOES, modo: modoRacoes },
    { ...PET, modo: modoPet },
  ];

  it("produto Herdar usa a Categoria Ativada", () => {
    const r = resolverDisponibilidadeEntregaPropria({
      modoProduto: "herdar",
      cadeiaCategorias: cadeia("ativado"),
      expedidoPorFornecedor: false,
    });
    assert.equal(r.ativo, true);
    assert.deepEqual(r.origem, {
      tipo: "categoria",
      categoriaId: "cat-racoes",
      categoriaNome: "Rações",
    });
  });

  it("sem configuração em nenhum nível: padrão da loja desativado", () => {
    const r = resolverDisponibilidadeEntregaPropria({
      modoProduto: "herdar",
      cadeiaCategorias: cadeia("herdar"),
      expedidoPorFornecedor: false,
    });
    assert.equal(r.ativo, false);
    assert.deepEqual(r.origem, { tipo: "padrao-loja" });
  });

  it("produto Desativado vence Categoria Ativada; Ativado vence Desativada", () => {
    assert.equal(
      resolverDisponibilidadeEntregaPropria({
        modoProduto: "desativado",
        cadeiaCategorias: cadeia("ativado"),
        expedidoPorFornecedor: false,
      }).ativo,
      false,
    );
    assert.equal(
      resolverDisponibilidadeEntregaPropria({
        modoProduto: "ativado",
        cadeiaCategorias: cadeia("desativado"),
        expedidoPorFornecedor: false,
      }).ativo,
      true,
    );
  });

  it("8. produto de fornecedor (Laquila) nunca recebe Entrega Própria da Categoria", () => {
    for (const modoProduto of ["herdar", "ativado"] as const) {
      const r = resolverDisponibilidadeEntregaPropria({
        modoProduto,
        cadeiaCategorias: cadeia("ativado"),
        expedidoPorFornecedor: true,
      });
      assert.equal(r.ativo, false);
      assert.deepEqual(r.origem, { tipo: "logistica-fornecedor" });
    }
  });

  it("produto anterior à herança mantém o antigo 'Permitir Entrega Própria'", () => {
    assert.equal(
      modoEntregaPropriaDoProduto({
        modo: null,
        permiteEntregaPropriaLegado: true,
      }),
      "ativado",
    );
    assert.equal(
      modoEntregaPropriaDoProduto({
        modo: null,
        permiteEntregaPropriaLegado: false,
      }),
      "desativado",
    );
    assert.equal(
      modoEntregaPropriaDoProduto({
        modo: null,
        permiteEntregaPropriaLegado: null,
      }),
      "desativado",
    );
    assert.equal(
      modoEntregaPropriaDoProduto({
        modo: "herdar",
        permiteEntregaPropriaLegado: false,
      }),
      "herdar",
    );
  });
});
