import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularPontosPreviaCheckout } from "./calcular-pontos-previa-checkout";

const itemPadrao = {
  id: "item-1",
  categoriaId: "categoria-padrao",
  valorBrutoEmCentavos: 10_000,
};

function calcular(
  sobrescritas: Partial<
    Parameters<typeof calcularPontosPreviaCheckout>[0]
  > = {},
) {
  return calcularPontosPreviaCheckout({
    programaAtivo: true,
    pontosPorRealGlobal: "1.0000",
    regrasCategorias: [
      {
        categoriaId: itemPadrao.categoriaId,
        ativa: true,
        pontosPorReal: null,
      },
    ],
    itens: [itemPadrao],
    descontoCupomEmCentavos: 0,
    creditoFidelidadeEmCentavos: 0,
    ...sobrescritas,
  });
}

describe("prévia de pontos do checkout", () => {
  it("usa regra global no preço total da quantidade", () => {
    assert.equal(
      calcular({
        itens: [{ ...itemPadrao, valorBrutoEmCentavos: 30_000 }],
      }),
      "300.0000",
    );
  });

  it("usa regra personalizada da categoria", () => {
    assert.equal(
      calcular({
        regrasCategorias: [
          {
            categoriaId: itemPadrao.categoriaId,
            ativa: true,
            pontosPorReal: "2.5000",
          },
        ],
      }),
      "250.0000",
    );
  });

  for (const [taxa, esperado] of [
    ["0.5000", "50.0000"],
    ["1.0000", "100.0000"],
    ["1.5000", "150.0000"],
    ["2.0000", "200.0000"],
  ] as const) {
    it(`calcula categoria participante com ${taxa} ponto por real`, () => {
      assert.equal(
        calcular({
          regrasCategorias: [
            {
              categoriaId: itemPadrao.categoriaId,
              ativa: true,
              pontosPorReal: taxa,
            },
          ],
        }),
        esperado,
      );
    });
  }

  it("categoria sem configuração não gera pontos", () => {
    assert.equal(calcular({ regrasCategorias: [] }), "0.0000");
  });

  it("ignora categoria não elegível e omite resultado zerado", () => {
    assert.equal(
      calcular({
        regrasCategorias: [
          {
            categoriaId: itemPadrao.categoriaId,
            ativa: false,
            pontosPorReal: null,
          },
        ],
      }),
      "0.0000",
    );
  });

  it("não pontua quando o programa global está desativado", () => {
    assert.equal(calcular({ programaAtivo: false }), "0.0000");
  });

  it("abate cupom e crédito de fidelidade juntos", () => {
    assert.equal(
      calcular({
        itens: [{ ...itemPadrao, valorBrutoEmCentavos: 20_000 }],
        descontoCupomEmCentavos: 2_000,
        creditoFidelidadeEmCentavos: 5_000,
      }),
      "130.0000",
    );
  });

  it("recalcula ao remover cupom e crédito", () => {
    assert.equal(
      calcular({
        descontoCupomEmCentavos: 2_000,
        creditoFidelidadeEmCentavos: 3_000,
      }),
      "50.0000",
    );
    assert.equal(calcular(), "100.0000");
  });

  it("não inclui frete ou juros porque recebe apenas os valores dos itens", () => {
    assert.equal(calcular(), "100.0000");
  });

  it("reproduz o rateio oficial em pedido misto", () => {
    assert.equal(
      calcular({
        itens: [
          itemPadrao,
          {
            id: "item-2",
            categoriaId: "categoria-personalizada",
            valorBrutoEmCentavos: 10_000,
          },
        ],
        regrasCategorias: [
          {
            categoriaId: itemPadrao.categoriaId,
            ativa: true,
            pontosPorReal: null,
          },
          {
            categoriaId: "categoria-personalizada",
            ativa: true,
            pontosPorReal: "2.0000",
          },
        ],
        descontoCupomEmCentavos: 2_000,
        creditoFidelidadeEmCentavos: 4_000,
      }),
      "210.0000",
    );
  });

  it("falha fechado como a geração real quando falta snapshot de categoria", () => {
    assert.equal(
      calcular({ itens: [{ ...itemPadrao, categoriaId: null }] }),
      "0.0000",
    );
  });
});
