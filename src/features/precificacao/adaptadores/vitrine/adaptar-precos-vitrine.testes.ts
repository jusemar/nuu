import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adaptarPrecosVitrine,
  criarChavePrecoVitrine,
} from "./adaptar-precos-vitrine";
import type {
  ConfiguracaoPagamentoCalculavel,
  EntradaPrecificacaoProduto,
  PromocaoPrecificacaoProduto,
} from "../../types/precificacao.types";
import type { ProdutoVitrinePrecificavel } from "../../types/precos-vitrine.types";

const configuracaoTeste: ConfiguracaoPagamentoCalculavel = {
  pixAtivo: true,
  cartaoAtivo: true,
  boletoAtivo: false,
  percentualAcrescimoCartaoBps: 0,
  parcelasSemJuros: 1,
  taxaJurosMensalBps: 0,
  maximoParcelas: 1,
  valorMinimoParcelaEmCentavos: 100,
};

const produtoUmId = "11111111-1111-4111-8111-111111111111";
const produtoDoisId = "22222222-2222-4222-8222-222222222222";
const produtoSimplesId = "33333333-3333-4333-8333-333333333333";
const produtoVariavelId = "44444444-4444-4444-8444-444444444444";
const produtoLegadoId = "55555555-5555-4555-8555-555555555555";
const produtoEngineId = "66666666-6666-4666-8666-666666666666";
const produtoFlashExpiradaId = "77777777-7777-4777-8777-777777777777";
const produtoFlashAtivaId = "99999999-9999-4999-8999-999999999999";
const produtoMultimodalId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function criarPromocaoInativa(
  entrada: EntradaPrecificacaoProduto,
): PromocaoPrecificacaoProduto {
  return {
    ativa: false,
    precoOriginalEmCentavos: entrada.precoBaseEmCentavos,
    precoFinalEmCentavos: entrada.precoBaseEmCentavos,
    descontoAplicadoEmCentavos: 0,
    regraAplicadaId: null,
    tipoDesconto: null,
    valorDesconto: 0,
  };
}

function criarDependenciasTeste(
  calcularPromocao: (
    entrada: EntradaPrecificacaoProduto,
  ) => PromocaoPrecificacaoProduto = criarPromocaoInativa,
) {
  return {
    buscarConfiguracao: async () => configuracaoTeste,
    aplicarPromocoes: async (entradas: EntradaPrecificacaoProduto[]) =>
      entradas.map((entrada) => ({
        entrada,
        promocao: calcularPromocao(entrada),
      })),
  };
}

describe("adaptarPrecosVitrine", () => {
  it("mantem chave unica por produto e modalidade sem sobrescrever stock", async () => {
    const produtos: ProdutoVitrinePrecificavel[] = [
      {
        id: produtoUmId,
        productKind: "simple",
        pricing: [{ type: "stock", price: 10000, mainCardPrice: true }],
      },
      {
        id: produtoDoisId,
        productKind: "simple",
        pricing: [{ type: "stock", price: 25000, mainCardPrice: true }],
      },
    ];

    const resultado = await adaptarPrecosVitrine(
      produtos,
      criarDependenciasTeste(),
    );

    assert.equal(
      resultado.precosPorChave[criarChavePrecoVitrine(produtoUmId, "stock")]
        ?.precoFinalEmCentavos,
      10000,
    );
    assert.equal(
      resultado.precosPorChave[criarChavePrecoVitrine(produtoDoisId, "stock")]
        ?.precoFinalEmCentavos,
      25000,
    );
  });

  it("normaliza produto simples pela modalidade principal", async () => {
    const resultado = await adaptarPrecosVitrine(
      [
        {
          id: produtoSimplesId,
          productKind: "simple",
          pricing: [
            { type: "stock", price: 10000, isActive: true },
            {
              type: "dropshipping",
              price: 12000,
              mainCardPrice: true,
              isActive: true,
            },
          ],
        },
      ],
      criarDependenciasTeste(),
    );
    const precoPrincipal =
      resultado.produtosPorId[produtoSimplesId]?.precoPrincipal;

    assert.equal(precoPrincipal?.modalidade, "dropshipping");
    assert.equal(precoPrincipal?.precoFinalEmCentavos, 12000);
    assert.equal(precoPrincipal?.possuiPromocao, false);
  });

  it("normaliza produto variavel usando variantes ativas como entradas seguras", async () => {
    const resultado = await adaptarPrecosVitrine(
      [
        {
          id: produtoVariavelId,
          productKind: "variable",
          pricing: [{ type: "stock", price: 99999, mainCardPrice: true }],
          variants: [
            { id: "variante-cara", priceInCents: 30000, isActive: true },
            { id: "variante-barata", priceInCents: 15000, isActive: true },
            { id: "variante-inativa", priceInCents: 1000, isActive: false },
          ],
        },
      ],
      criarDependenciasTeste(),
    );
    const produto = resultado.produtosPorId[produtoVariavelId];

    assert.equal(produto?.precos.length, 2);
    assert.equal(produto?.precoPrincipal?.varianteId, "variante-barata");
    assert.equal(produto?.precoPrincipal?.precoFinalEmCentavos, 15000);
  });

  it("aplica promocao legada vigente quando ela for o melhor beneficio", async () => {
    const resultado = await adaptarPrecosVitrine(
      [
        {
          id: produtoLegadoId,
          productKind: "simple",
          pricing: [
            {
              type: "stock",
              price: 10000,
              mainCardPrice: true,
              hasPromo: true,
              promoType: "normal",
              promoPrice: 7000,
            },
          ],
        },
      ],
      criarDependenciasTeste(),
    );
    const preco = resultado.produtosPorId[produtoLegadoId]?.precoPrincipal;

    assert.equal(preco?.precoFinalEmCentavos, 7000);
    assert.equal(preco?.origemPromocaoAplicada, "legado");
    assert.equal(preco?.promocaoLegadaEngine.ativa, true);
    assert.equal(preco?.tipoCampanhaPromocional, "promocao_normal");
    assert.equal(preco?.badgePromocional, "promocao");
    assert.equal(preco?.countdownPromocional.ativo, false);
    assert.equal(preco?.percentualOff, 30);
    assert.equal(preco?.economiaEmCentavos, 3000);
  });

  it("aplica Promotion Engine quando ele oferecer maior beneficio que legado", async () => {
    const resultado = await adaptarPrecosVitrine(
      [
        {
          id: produtoEngineId,
          productKind: "simple",
          pricing: [
            {
              type: "stock",
              price: 10000,
              mainCardPrice: true,
              hasPromo: true,
              promoType: "normal",
              promoPrice: 8500,
            },
          ],
        },
      ],
      criarDependenciasTeste((entrada) => ({
        ativa: true,
        precoOriginalEmCentavos: entrada.precoBaseEmCentavos,
        precoFinalEmCentavos: 6000,
        descontoAplicadoEmCentavos: 4000,
        regraAplicadaId: "88888888-8888-4888-8888-888888888888",
        tipoDesconto: "percentual",
        valorDesconto: 40,
      })),
    );
    const preco = resultado.produtosPorId[produtoEngineId]?.precoPrincipal;

    assert.equal(preco?.precoFinalEmCentavos, 6000);
    assert.equal(preco?.origemPromocaoAplicada, "promotion_engine");
    assert.equal(preco?.tipoCampanhaPromocional, "promocao_normal");
    assert.equal(preco?.badgePromocional, "promocao");
    assert.equal(preco?.countdownPromocional.ativo, false);
    assert.equal(
      preco?.promocaoEngine.regraAplicadaId,
      "88888888-8888-4888-8888-888888888888",
    );
    assert.equal(preco?.percentualOff, 40);
  });

  it("centraliza metadados de oferta relampago legada vigente", async () => {
    const resultado = await adaptarPrecosVitrine(
      [
        {
          id: produtoFlashAtivaId,
          productKind: "simple",
          pricing: [
            {
              type: "stock",
              price: 10000,
              mainCardPrice: true,
              hasPromo: true,
              promoType: "flash",
              promoPrice: 5000,
              promoEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          ],
        },
      ],
      criarDependenciasTeste(),
    );
    const preco = resultado.produtosPorId[produtoFlashAtivaId]?.precoPrincipal;

    assert.equal(preco?.precoFinalEmCentavos, 5000);
    assert.equal(preco?.origemPromocaoAplicada, "legado");
    assert.equal(preco?.tipoCampanhaPromocional, "oferta_relampago");
    assert.equal(preco?.badgePromocional, "relampago");
    assert.equal(preco?.countdownPromocional.ativo, true);
    assert.ok(preco?.promocaoLegada.regraPromocaoId);
  });

  it("prioriza metadados oficiais de relampago quando Promotion Engine vence", async () => {
    const dataFimOficial = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const resultado = await adaptarPrecosVitrine(
      [
        {
          id: produtoEngineId,
          productKind: "simple",
          pricing: [
            {
              type: "stock",
              price: 10000,
              mainCardPrice: true,
              hasPromo: true,
              promoType: "flash",
              promoPrice: 8000,
              promoEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          ],
        },
      ],
      criarDependenciasTeste((entrada) => ({
        ativa: true,
        precoOriginalEmCentavos: entrada.precoBaseEmCentavos,
        precoFinalEmCentavos: 5000,
        descontoAplicadoEmCentavos: 5000,
        regraAplicadaId: "abababab-abab-4aba-8aba-abababababab",
        tipoDesconto: "percentual",
        valorDesconto: 50,
        tipoCampanha: "relampago",
        badgePromocional: "Oferta relâmpago",
        countdownPromocionalDataFim: dataFimOficial,
      })),
    );
    const preco = resultado.produtosPorId[produtoEngineId]?.precoPrincipal;

    assert.equal(preco?.origemPromocaoAplicada, "promotion_engine");
    assert.equal(preco?.legadoIgnoradoPorOficial, false);
    assert.equal(preco?.tipoCampanhaPromocional, "oferta_relampago");
    assert.equal(preco?.badgePromocional, "relampago");
    assert.equal(preco?.countdownPromocional.ativo, true);
    assert.equal(
      preco?.countdownPromocional.dataFim?.toISOString(),
      dataFimOficial.toISOString(),
    );
  });

  it("prioriza Promotion Engine quando beneficio empata com legado", async () => {
    const dataFim = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const resultado = await adaptarPrecosVitrine(
      [
        {
          id: produtoEngineId,
          productKind: "simple",
          pricing: [
            {
              type: "stock",
              price: 10000,
              mainCardPrice: true,
              hasPromo: true,
              promoType: "flash",
              promoPrice: 7000,
              promoEndDate: dataFim,
            },
          ],
        },
      ],
      criarDependenciasTeste((entrada) => ({
        ativa: true,
        precoOriginalEmCentavos: entrada.precoBaseEmCentavos,
        precoFinalEmCentavos: 7000,
        descontoAplicadoEmCentavos: 3000,
        regraAplicadaId: "abababab-abab-4aba-8aba-abababababab",
        tipoDesconto: "valor_fixo",
        valorDesconto: 3000,
        tipoCampanha: "relampago",
        badgePromocional: "relampago",
        countdownPromocionalDataFim: dataFim,
      })),
    );
    const preco = resultado.produtosPorId[produtoEngineId]?.precoPrincipal;

    assert.equal(preco?.precoFinalEmCentavos, 7000);
    assert.equal(preco?.origemPromocaoAplicada, "promotion_engine");
    assert.equal(preco?.legadoIgnoradoPorOficial, true);
    assert.equal(preco?.tipoCampanhaPromocional, "oferta_relampago");
    assert.equal(preco?.badgePromocional, "relampago");
  });

  it("ignora oferta legada marcada como migrada e mantem oficial ativa", async () => {
    const dataFim = new Date("2026-06-05T02:00:00.000Z");
    const resultado = await adaptarPrecosVitrine(
      [
        {
          id: produtoEngineId,
          productKind: "simple",
          pricing: [
            {
              type: "dropshipping",
              price: 49900,
              mainCardPrice: true,
              hasPromo: true,
              promoType: "flash",
              promoPrice: 37900,
              promoEndDate: dataFim,
              legadoPromocaoMigradoEm: new Date("2026-06-02T10:00:00.000Z"),
              legadoPromocaoMigradoParaRegraId:
                "abababab-abab-4aba-8aba-abababababab",
            },
          ],
        },
      ],
      criarDependenciasTeste((entrada) => ({
        ativa: true,
        precoOriginalEmCentavos: entrada.precoBaseEmCentavos,
        precoFinalEmCentavos: 37900,
        descontoAplicadoEmCentavos: 12000,
        regraAplicadaId: "abababab-abab-4aba-8aba-abababababab",
        tipoDesconto: "valor_fixo",
        valorDesconto: 12000,
        tipoCampanha: "relampago",
        badgePromocional: "relampago",
        countdownPromocionalDataFim: dataFim,
      })),
    );
    const preco = resultado.produtosPorId[produtoEngineId]?.precoPrincipal;

    assert.equal(preco?.precoFinalEmCentavos, 37900);
    assert.equal(preco?.origemPromocaoAplicada, "promotion_engine");
    assert.equal(preco?.promocaoLegadaEngine.ativa, false);
    assert.equal(
      preco?.legadoPromocaoMigradoParaRegraId,
      preco?.promocaoEngine.regraAplicadaId,
    );
  });

  it("nao vaza promocao legada entre modalidades do mesmo produto", async () => {
    const resultado = await adaptarPrecosVitrine(
      [
        {
          id: produtoMultimodalId,
          productKind: "simple",
          pricing: [
            {
              type: "stock",
              price: 10000,
              mainCardPrice: true,
              hasPromo: true,
              promoType: "normal",
              promoPrice: 7000,
            },
            {
              type: "dropshipping",
              price: 12000,
              mainCardPrice: false,
              hasPromo: false,
              promoType: null,
              promoPrice: null,
            },
          ],
        },
      ],
      criarDependenciasTeste(),
    );

    const precoStock =
      resultado.precosPorChave[
        criarChavePrecoVitrine(produtoMultimodalId, "stock")
      ];
    const precoDropshipping =
      resultado.precosPorChave[
        criarChavePrecoVitrine(produtoMultimodalId, "dropshipping")
      ];

    assert.equal(precoStock?.precoFinalEmCentavos, 7000);
    assert.equal(precoStock?.origemPromocaoAplicada, "legado");
    assert.equal(precoDropshipping?.precoFinalEmCentavos, 12000);
    assert.equal(precoDropshipping?.origemPromocaoAplicada, "sem_promocao");
  });

  it("ignora oferta relampago legada expirada", async () => {
    const resultado = await adaptarPrecosVitrine(
      [
        {
          id: produtoFlashExpiradaId,
          productKind: "simple",
          pricing: [
            {
              type: "stock",
              price: 10000,
              mainCardPrice: true,
              hasPromo: true,
              promoType: "flash",
              promoPrice: 5000,
              promoEndDate: new Date("2020-01-01T00:00:00.000Z"),
            },
          ],
        },
      ],
      criarDependenciasTeste(),
    );
    const preco =
      resultado.produtosPorId[produtoFlashExpiradaId]?.precoPrincipal;

    assert.equal(preco?.precoFinalEmCentavos, 10000);
    assert.equal(preco?.origemPromocaoAplicada, "sem_promocao");
    assert.equal(preco?.possuiPromocao, false);
    assert.equal(preco?.badgePromocional, null);
    assert.equal(preco?.countdownPromocional.ativo, false);
  });
});
