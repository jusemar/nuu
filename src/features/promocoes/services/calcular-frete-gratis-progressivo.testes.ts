import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calcularFreteGratisProgressivo,
  type EntradaCalcularFreteGratisProgressivo,
} from "./calcular-frete-gratis-progressivo";

function criarEntrada(
  sobrescrita: Partial<EntradaCalcularFreteGratisProgressivo> = {},
): EntradaCalcularFreteGratisProgressivo {
  return {
    subtotalEmCentavos: 21000,
    modalidades: ["dropshipping"],
    regrasFreteGratis: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        regraPromocaoId: "22222222-2222-4222-8222-222222222222",
        subtotalMinimo: 29900,
        modalidade: null,
        mensagemProgressiva: null,
        regiaoCodigo: null,
        transportadoraCodigo: null,
        servicoCodigo: null,
      },
    ],
    ...sobrescrita,
  };
}

describe("calcularFreteGratisProgressivo", () => {
  it("retorna faltante quando subtotal esta abaixo da meta", async () => {
    const resultado = await calcularFreteGratisProgressivo(criarEntrada());

    assert.equal(resultado.ativo, true);
    assert.equal(resultado.atingido, false);
    assert.equal(resultado.freteGratisAtingido, false);
    assert.equal(resultado.faltanteEmCentavos, 8900);
    assert.equal(resultado.freteGratisFaltante, 8900);
    assert.equal(resultado.freteGratisSubtotalMeta, 29900);
    assert.equal(resultado.percentualProgresso, 70);
    assert.equal(resultado.regiaoCodigo, null);
    assert.deepEqual(resultado.modalidadesElegiveis, ["dropshipping"]);
    assert.equal(
      resultado.regraFreteGratisAplicada?.id,
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("marca como atingido quando subtotal alcanca a meta", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({ subtotalEmCentavos: 29900 }),
    );

    assert.equal(resultado.atingido, true);
    assert.equal(resultado.freteGratisAtingido, true);
    assert.equal(resultado.faltanteEmCentavos, 0);
    assert.equal(resultado.freteGratisFaltante, 0);
    assert.equal(resultado.percentualProgresso, 100);
  });

  it("respeita modalidade opcional da regra", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({
        regrasFreteGratis: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            regraPromocaoId: "22222222-2222-4222-8222-222222222222",
            subtotalMinimo: 29900,
            modalidade: "stock",
            mensagemProgressiva: null,
            regiaoCodigo: null,
            transportadoraCodigo: null,
            servicoCodigo: null,
          },
        ],
      }),
    );

    assert.equal(resultado.ativo, false);
  });

  it("aplica regra por modalidade quando modalidade do pedido e elegivel", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 49900,
        modalidades: ["dropshipping"],
        regrasFreteGratis: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            regraPromocaoId: "22222222-2222-4222-8222-222222222222",
            subtotalMinimo: 49900,
            modalidade: "dropshipping",
            mensagemProgressiva: null,
            regiaoCodigo: null,
            transportadoraCodigo: null,
            servicoCodigo: null,
          },
        ],
      }),
    );

    assert.equal(resultado.ativo, true);
    assert.equal(resultado.freteGratisAtingido, true);
    assert.equal(resultado.modalidade, "dropshipping");
    assert.equal(
      resultado.regraFreteGratisAplicada?.modalidade,
      "dropshipping",
    );
  });

  it("aplica regra regional quando a entrega possui regiao elegivel", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 35000,
        regioesEntregaCodigos: ["brasil", "macrorregiao:sudeste", "uf:MG"],
        regrasFreteGratis: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            regraPromocaoId: "22222222-2222-4222-8222-222222222222",
            subtotalMinimo: 29900,
            modalidade: null,
            mensagemProgressiva: null,
            regiaoCodigo: "macrorregiao:sudeste",
            transportadoraCodigo: null,
            servicoCodigo: null,
          },
        ],
      }),
    );

    assert.equal(resultado.ativo, true);
    assert.equal(resultado.freteGratisAtingido, true);
    assert.equal(resultado.regiaoCodigo, "macrorregiao:sudeste");
    assert.equal(
      resultado.regraFreteGratisAplicada?.regiaoCodigo,
      "macrorregiao:sudeste",
    );
  });

  it("ignora regra regional quando a entrega nao possui regiao elegivel", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 35000,
        regioesEntregaCodigos: ["brasil", "macrorregiao:sul", "uf:PR"],
        regrasFreteGratis: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            regraPromocaoId: "22222222-2222-4222-8222-222222222222",
            subtotalMinimo: 29900,
            modalidade: null,
            mensagemProgressiva: null,
            regiaoCodigo: "macrorregiao:sudeste",
            transportadoraCodigo: null,
            servicoCodigo: null,
          },
        ],
      }),
    );

    assert.equal(resultado.ativo, false);
    assert.deepEqual(resultado.regioesEntregaCodigos, [
      "brasil",
      "macrorregiao:sul",
      "uf:PR",
    ]);
  });

  it("exige regiao e modalidade quando ambas estao configuradas", async () => {
    const regraRegionalPorModalidade = {
      id: "11111111-1111-4111-8111-111111111111",
      regraPromocaoId: "22222222-2222-4222-8222-222222222222",
      subtotalMinimo: 39900,
      modalidade: "stock",
      mensagemProgressiva: null,
      regiaoCodigo: "macrorregiao:sudeste",
      transportadoraCodigo: null,
      servicoCodigo: null,
    };
    const resultadoElegivel = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 39900,
        modalidades: ["stock"],
        regioesEntregaCodigos: ["brasil", "macrorregiao:sudeste", "uf:MG"],
        regrasFreteGratis: [regraRegionalPorModalidade],
      }),
    );
    const resultadoModalidadeDivergente = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 39900,
        modalidades: ["dropshipping"],
        regioesEntregaCodigos: ["brasil", "macrorregiao:sudeste", "uf:MG"],
        regrasFreteGratis: [regraRegionalPorModalidade],
      }),
    );

    assert.equal(resultadoElegivel.freteGratisAtingido, true);
    assert.equal(resultadoElegivel.modalidade, "stock");
    assert.equal(resultadoElegivel.regiaoCodigo, "macrorregiao:sudeste");
    assert.equal(resultadoModalidadeDivergente.ativo, false);
  });

  it("mantem progresso seguro para carrinho vazio", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({ subtotalEmCentavos: 0, modalidades: [] }),
    );

    assert.equal(resultado.ativo, true);
    assert.equal(resultado.freteGratisAtingido, false);
    assert.equal(resultado.freteGratisFaltante, 29900);
    assert.equal(resultado.percentualProgresso, 0);
  });

  it("seleciona menor meta ainda nao atingida entre multiplas regras", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 35000,
        regrasFreteGratis: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            regraPromocaoId: "22222222-2222-4222-8222-222222222222",
            subtotalMinimo: 29900,
            modalidade: null,
            mensagemProgressiva: null,
            regiaoCodigo: null,
            transportadoraCodigo: null,
            servicoCodigo: null,
          },
          {
            id: "33333333-3333-4333-8333-333333333333",
            regraPromocaoId: "44444444-4444-4444-8444-444444444444",
            subtotalMinimo: 50000,
            modalidade: null,
            mensagemProgressiva: "Falta pouco para frete premium.",
            regiaoCodigo: null,
            transportadoraCodigo: null,
            servicoCodigo: null,
          },
        ],
      }),
    );

    assert.equal(resultado.subtotalMinimoEmCentavos, 50000);
    assert.equal(resultado.faltanteEmCentavos, 15000);
    assert.equal(resultado.mensagem, "Falta pouco para frete premium.");
  });

  it("aplica regra por transportadora quando frete selecionado e elegivel", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 39900,
        fretesSelecionadosCodigos: [
          "transportadora:frenet:correios",
          "servico:frenet:sedex",
        ],
        regrasFreteGratis: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            regraPromocaoId: "22222222-2222-4222-8222-222222222222",
            subtotalMinimo: 39900,
            modalidade: null,
            mensagemProgressiva: null,
            regiaoCodigo: null,
            transportadoraCodigo: "transportadora:frenet:correios",
            servicoCodigo: null,
          },
        ],
      }),
    );

    assert.equal(resultado.freteGratisAtingido, true);
    assert.equal(
      resultado.transportadoraCodigo,
      "transportadora:frenet:correios",
    );
    assert.equal(resultado.tipoPrioridade, "transportadora");
  });

  it("ignora regra por servico quando servico selecionado diverge", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 49900,
        fretesSelecionadosCodigos: ["servico:frenet:pac"],
        regrasFreteGratis: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            regraPromocaoId: "22222222-2222-4222-8222-222222222222",
            subtotalMinimo: 49900,
            modalidade: null,
            mensagemProgressiva: null,
            regiaoCodigo: null,
            transportadoraCodigo: null,
            servicoCodigo: "servico:frenet:sedex",
          },
        ],
      }),
    );

    assert.equal(resultado.ativo, false);
  });

  it("exige regiao modalidade e servico quando todos estao configurados", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 69900,
        modalidades: ["dropshipping"],
        regioesEntregaCodigos: ["brasil", "macrorregiao:sudeste"],
        fretesSelecionadosCodigos: ["servico:frenet:sedex"],
        regrasFreteGratis: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            regraPromocaoId: "22222222-2222-4222-8222-222222222222",
            subtotalMinimo: 69900,
            modalidade: "dropshipping",
            mensagemProgressiva: null,
            regiaoCodigo: "macrorregiao:sudeste",
            transportadoraCodigo: null,
            servicoCodigo: "servico:frenet:sedex",
          },
        ],
      }),
    );

    assert.equal(resultado.freteGratisAtingido, true);
    assert.equal(resultado.modalidade, "dropshipping");
    assert.equal(resultado.regiaoCodigo, "macrorregiao:sudeste");
    assert.equal(resultado.servicoCodigo, "servico:frenet:sedex");
    assert.equal(resultado.tipoPrioridade, "servico");
  });

  it("aplica regra de servico antes da regra global quando ambas sao compativeis", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 35000,
        fretesSelecionadosCodigos: [
          "transportadora:frenet:correios",
          "servico:frenet:pac",
        ],
        regrasFreteGratis: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            regraPromocaoId: "22222222-2222-4222-8222-222222222222",
            subtotalMinimo: 29900,
            modalidade: null,
            mensagemProgressiva: null,
            regiaoCodigo: null,
            transportadoraCodigo: null,
            servicoCodigo: null,
          },
          {
            id: "33333333-3333-4333-8333-333333333333",
            regraPromocaoId: "44444444-4444-4444-8444-444444444444",
            subtotalMinimo: 29900,
            modalidade: null,
            mensagemProgressiva: null,
            regiaoCodigo: null,
            transportadoraCodigo: "transportadora:frenet:correios",
            servicoCodigo: "servico:frenet:pac",
          },
        ],
      }),
    );

    assert.equal(resultado.freteGratisAtingido, true);
    assert.equal(
      resultado.regraFreteGratisId,
      "33333333-3333-4333-8333-333333333333",
    );
    assert.equal(resultado.tipoPrioridade, "servico");
    assert.deepEqual(resultado.regrasIgnoradasPorPrecedencia, [
      {
        id: "11111111-1111-4111-8111-111111111111",
        regraPromocaoId: "22222222-2222-4222-8222-222222222222",
        tipoPrioridade: "global",
      },
    ]);
  });

  it("aplica regra de transportadora antes da global quando servico especifico diverge", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 35000,
        fretesSelecionadosCodigos: [
          "transportadora:frenet:correios",
          "servico:frenet:sedex",
        ],
        regrasFreteGratis: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            regraPromocaoId: "22222222-2222-4222-8222-222222222222",
            subtotalMinimo: 29900,
            modalidade: null,
            mensagemProgressiva: null,
            regiaoCodigo: null,
            transportadoraCodigo: null,
            servicoCodigo: null,
          },
          {
            id: "33333333-3333-4333-8333-333333333333",
            regraPromocaoId: "44444444-4444-4444-8444-444444444444",
            subtotalMinimo: 29900,
            modalidade: null,
            mensagemProgressiva: null,
            regiaoCodigo: null,
            transportadoraCodigo: "transportadora:frenet:correios",
            servicoCodigo: null,
          },
          {
            id: "55555555-5555-4555-8555-555555555555",
            regraPromocaoId: "66666666-6666-4666-8666-666666666666",
            subtotalMinimo: 29900,
            modalidade: null,
            mensagemProgressiva: null,
            regiaoCodigo: null,
            transportadoraCodigo: null,
            servicoCodigo: "servico:frenet:pac",
          },
        ],
      }),
    );

    assert.equal(
      resultado.regraFreteGratisId,
      "33333333-3333-4333-8333-333333333333",
    );
    assert.equal(resultado.tipoPrioridade, "transportadora");
  });

  it("aplica regra por modalidade antes de regra regional compativel", async () => {
    const resultado = await calcularFreteGratisProgressivo(
      criarEntrada({
        subtotalEmCentavos: 35000,
        modalidades: ["dropshipping"],
        regioesEntregaCodigos: ["brasil", "macrorregiao:sudeste"],
        regrasFreteGratis: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            regraPromocaoId: "22222222-2222-4222-8222-222222222222",
            subtotalMinimo: 29900,
            modalidade: null,
            mensagemProgressiva: null,
            regiaoCodigo: "macrorregiao:sudeste",
            transportadoraCodigo: null,
            servicoCodigo: null,
          },
          {
            id: "33333333-3333-4333-8333-333333333333",
            regraPromocaoId: "44444444-4444-4444-8444-444444444444",
            subtotalMinimo: 29900,
            modalidade: "dropshipping",
            mensagemProgressiva: null,
            regiaoCodigo: null,
            transportadoraCodigo: null,
            servicoCodigo: null,
          },
        ],
      }),
    );

    assert.equal(
      resultado.regraFreteGratisId,
      "33333333-3333-4333-8333-333333333333",
    );
    assert.equal(resultado.tipoPrioridade, "modalidade");
    assert.equal(
      resultado.regrasIgnoradasPorPrecedencia[0]?.tipoPrioridade,
      "regiao",
    );
  });
});
