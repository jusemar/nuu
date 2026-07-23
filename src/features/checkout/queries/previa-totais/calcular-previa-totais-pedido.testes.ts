import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ResultadoFreteGratisProgressivo } from "@/features/promocoes/services";

import {
  extrairFormasEntregaPromocionaisFreteGratis,
  extrairModalidadesPromocionaisFreteGratis,
} from "../../lib/frete-gratis-promocional/extrair-modalidades-promocionais-frete-gratis";
import type { TotaisCheckout } from "../../types/checkout.types";
import {
  calcularFreteGratisPromocionalPedido,
  calcularSubtotalElegibilidadeFreteGratisPromocional,
} from "./calcular-previa-totais-pedido";

const totaisComFrete: TotaisCheckout = {
  subtotalEmCentavos: 35000,
  freteEmCentavos: 2500,
  descontoEmCentavos: 0,
  totalEmCentavos: 37500,
};

const freteGratisAtingido: ResultadoFreteGratisProgressivo = {
  ativo: true,
  atingido: true,
  freteGratisAtingido: true,
  subtotalEmCentavos: 35000,
  subtotalMinimoEmCentavos: 29900,
  freteGratisSubtotalMeta: 29900,
  faltanteEmCentavos: 0,
  freteGratisFaltante: 0,
  percentualProgresso: 100,
  modalidade: null,
  modalidadesElegiveis: ["dropshipping"],
  formaEntrega: "frete-externo",
  formasEntregaElegiveis: ["frete-externo"],
  mensagem: "Frete gratis desbloqueado.",
  regiaoCodigo: "macrorregiao:sudeste",
  regioesEntregaCodigos: ["brasil", "macrorregiao:sudeste", "uf:MG"],
  transportadoraCodigo: "transportadora:frenet:correios",
  servicoCodigo: "servico:frenet:sedex",
  fretesSelecionadosCodigos: [
    "transportadora:frenet:correios",
    "servico:frenet:sedex",
  ],
  regraFreteGratisId: "11111111-1111-4111-8111-111111111111",
  regraPromocaoId: "22222222-2222-4222-8222-222222222222",
  tipoPrioridade: "servico",
  regrasIgnoradasPorPrecedencia: [],
  regraFreteGratisAplicada: {
    id: "11111111-1111-4111-8111-111111111111",
    regraPromocaoId: "22222222-2222-4222-8222-222222222222",
    modalidade: null,
    formaEntrega: "frete-externo",
    regiaoCodigo: "macrorregiao:sudeste",
    transportadoraCodigo: "transportadora:frenet:correios",
    servicoCodigo: "servico:frenet:sedex",
    tipoPrioridade: "servico",
  },
};

const freteGratisNaoAtingido: ResultadoFreteGratisProgressivo = {
  ...freteGratisAtingido,
  atingido: false,
  freteGratisAtingido: false,
  subtotalEmCentavos: 21000,
  faltanteEmCentavos: 8900,
  freteGratisFaltante: 8900,
  percentualProgresso: 70,
};

describe("calcularPreviaTotaisPedido helpers", () => {
  it("separa modalidade comercial da forma de entrega para elegibilidade promocional", () => {
    const modalidades = extrairModalidadesPromocionaisFreteGratis([
      {
        id: "item-1",
        produtoId: "11111111-1111-4111-8111-111111111111",
        nome: "Produto",
        modalidadeTipo: "stock",
        freteEscolhido: {
          id: "entrega-propria",
          nome: "Entrega própria",
          prazo: "Hoje",
          valorEmCentavos: 1800,
        },
        imagemUrl: "/produto.webp",
        precoEmCentavos: 10000,
        quantidade: 1,
      },
    ]);

    assert.deepEqual(modalidades, ["stock"]);
    assert.deepEqual(
      extrairFormasEntregaPromocionaisFreteGratis([
        {
          id: "item-1",
          produtoId: "11111111-1111-4111-8111-111111111111",
          nome: "Produto",
          modalidadeTipo: "stock",
          freteEscolhido: {
            id: "entrega-propria",
            nome: "Entrega própria",
            prazo: "Hoje",
            valorEmCentavos: 1800,
          },
          imagemUrl: "/produto.webp",
          precoEmCentavos: 10000,
          quantidade: 1,
        },
      ]),
      ["entrega-propria"],
    );
  });

  it("aplica frete gratis promocional somente quando elegivel", async () => {
    const resultado = await calcularFreteGratisPromocionalPedido({
      totais: totaisComFrete,
      freteGratisProgressivo: freteGratisAtingido,
      aplicarFreteGratisPromocional: true,
    });

    assert.equal(resultado.elegivel, true);
    assert.equal(resultado.freteGratisPromocionalAplicado, true);
    assert.equal(resultado.valorFreteOriginalEmCentavos, 2500);
    assert.equal(resultado.valorFreteFinalEmCentavos, 0);
    assert.equal(resultado.descontoFretePromocionalEmCentavos, 2500);
    assert.equal(resultado.modalidadeAplicada, null);
    assert.deepEqual(resultado.modalidadesElegiveis, ["dropshipping"]);
    assert.equal(resultado.formaEntregaAplicada, "frete-externo");
    assert.deepEqual(resultado.formasEntregaElegiveis, ["frete-externo"]);
    assert.equal(resultado.regiaoAplicada, "macrorregiao:sudeste");
    assert.deepEqual(resultado.regioesElegiveis, [
      "brasil",
      "macrorregiao:sudeste",
      "uf:MG",
    ]);
    assert.equal(
      resultado.transportadoraAplicada,
      "transportadora:frenet:correios",
    );
    assert.equal(resultado.servicoAplicado, "servico:frenet:sedex");
    assert.equal(resultado.tipoPrioridadeFreteGratis, "servico");
    assert.deepEqual(resultado.regrasIgnoradasPorPrecedencia, []);
  });

  it("preserva frete original quando aplicacao para gateway esta desligada", async () => {
    const resultado = await calcularFreteGratisPromocionalPedido({
      totais: totaisComFrete,
      freteGratisProgressivo: freteGratisAtingido,
      aplicarFreteGratisPromocional: false,
    });

    assert.equal(resultado.elegivel, true);
    assert.equal(resultado.freteGratisPromocionalAplicado, false);
    assert.equal(resultado.valorFreteOriginalEmCentavos, 2500);
    assert.equal(resultado.valorFreteFinalEmCentavos, 2500);
    assert.equal(resultado.descontoFretePromocionalEmCentavos, 0);
  });

  it("nao aplica quando meta progressiva nao foi atingida", async () => {
    const resultado = await calcularFreteGratisPromocionalPedido({
      totais: totaisComFrete,
      freteGratisProgressivo: freteGratisNaoAtingido,
      aplicarFreteGratisPromocional: true,
    });

    assert.equal(resultado.elegivel, false);
    assert.equal(resultado.freteGratisPromocionalAplicado, false);
    assert.equal(resultado.valorFreteFinalEmCentavos, 2500);
  });

  it("remove elegibilidade quando cupom reduz subtotal abaixo da meta", async () => {
    const subtotalElegivel =
      await calcularSubtotalElegibilidadeFreteGratisPromocional({
        subtotalEmCentavos: 35000,
        descontoCupomEmCentavos: 6000,
      });

    assert.equal(subtotalElegivel, 29000);
  });
});
