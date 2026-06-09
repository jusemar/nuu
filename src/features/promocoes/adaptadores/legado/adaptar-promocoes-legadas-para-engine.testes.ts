import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularPromocoes } from "../../services/calcular-promocoes";
import { adaptarPromocoesLegadasParaEngine } from "./adaptar-promocoes-legadas-para-engine";

const produtoId = "11111111-1111-4111-8111-111111111111";
const produtoFlashId = "22222222-2222-4222-8222-222222222222";
const dataReferencia = new Date("2026-01-10T12:00:00.000Z");

describe("adaptarPromocoesLegadasParaEngine", () => {
  it("converte promocao normal legada para regra e vinculo compativeis com engine", () => {
    const resultado = adaptarPromocoesLegadasParaEngine(
      [
        {
          produtoId,
          modalidade: "stock",
          precoBaseEmCentavos: 10000,
          hasPromo: true,
          promoType: "normal",
          promoPrice: 7500,
          mainCardPrice: true,
        },
      ],
      { dataReferencia },
    );

    assert.equal(resultado.regras.length, 1);
    assert.equal(resultado.produtosPromocao.length, 1);
    assert.equal(resultado.campanhas.length, 1);
    assert.equal(resultado.regras[0]?.status, "ativa");
    assert.equal(resultado.regras[0]?.tipoDesconto, "valor_fixo");
    assert.equal(resultado.produtosPromocao[0]?.valorDesconto, 2500);
    assert.equal(resultado.campanhas[0]?.badge, "promocao");
    assert.equal(resultado.campanhas[0]?.countdown.ativo, false);
  });

  it("converte oferta relampago vigente com badge e countdown centralizados", () => {
    const resultado = adaptarPromocoesLegadasParaEngine(
      [
        {
          produtoId: produtoFlashId,
          modalidade: "stock",
          precoBaseEmCentavos: 20000,
          hasPromo: true,
          promoType: "flash",
          promoPrice: 12000,
          promoEndDate: new Date("2026-01-11T12:00:00.000Z"),
        },
      ],
      { dataReferencia },
    );

    assert.equal(resultado.regras[0]?.status, "ativa");
    assert.equal(resultado.regras[0]?.prioridade, 900);
    assert.equal(resultado.campanhas[0]?.tipoCampanha, "oferta_relampago");
    assert.equal(resultado.campanhas[0]?.badge, "relampago");
    assert.equal(resultado.campanhas[0]?.countdown.ativo, true);
  });

  it("marca oferta relampago expirada como encerrada sem perder compatibilidade", () => {
    const resultado = adaptarPromocoesLegadasParaEngine(
      [
        {
          produtoId: produtoFlashId,
          modalidade: "stock",
          precoBaseEmCentavos: 20000,
          hasPromo: true,
          promoType: "flash",
          promoPrice: 12000,
          promoEndDate: new Date("2026-01-01T12:00:00.000Z"),
        },
      ],
      { dataReferencia },
    );

    assert.equal(resultado.regras[0]?.status, "encerrada");
    assert.equal(resultado.campanhas[0]?.countdown.ativo, false);
  });

  it("ignora promocao legada sem beneficio real com aviso seguro", () => {
    const resultado = adaptarPromocoesLegadasParaEngine(
      [
        {
          produtoId,
          modalidade: "stock",
          precoBaseEmCentavos: 10000,
          hasPromo: true,
          promoType: "normal",
          promoPrice: 11000,
        },
      ],
      { dataReferencia },
    );

    assert.equal(resultado.regras.length, 0);
    assert.equal(resultado.produtosPromocao.length, 0);
    assert.equal(resultado.campanhas.length, 0);
    assert.equal(resultado.avisos.length, 1);
  });

  it("gera ids deterministiscos para evitar instabilidade em lote", () => {
    const entradas = [
      {
        produtoId,
        modalidade: "stock",
        precoBaseEmCentavos: 10000,
        hasPromo: true,
        promoType: "normal",
        promoPrice: 7500,
      },
    ];
    const primeiroResultado = adaptarPromocoesLegadasParaEngine(entradas, {
      dataReferencia,
    });
    const segundoResultado = adaptarPromocoesLegadasParaEngine(entradas, {
      dataReferencia,
    });

    assert.equal(
      primeiroResultado.regras[0]?.id,
      segundoResultado.regras[0]?.id,
    );
    assert.equal(
      primeiroResultado.produtosPromocao[0]?.id,
      segundoResultado.produtosPromocao[0]?.id,
    );
  });

  it("permite calcular promocao legada convertida pelo engine sem alterar o engine", async () => {
    const legado = adaptarPromocoesLegadasParaEngine(
      [
        {
          produtoId,
          modalidade: "stock",
          precoBaseEmCentavos: 10000,
          hasPromo: true,
          promoType: "normal",
          promoPrice: 7000,
        },
      ],
      { dataReferencia },
    );
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId,
          modalidade: "stock",
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      regras: legado.regras,
      produtosPromocao: legado.produtosPromocao,
      contexto: {
        dataReferencia,
      },
    });

    assert.equal(resultado.itens[0]?.preco_final, 7000);
    assert.equal(resultado.itens[0]?.desconto_aplicado, 3000);
    assert.equal(resultado.regrasAplicadas.length, 1);
  });
});
