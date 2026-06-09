import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularPromocoes } from "./calcular-promocoes";
import type {
  CupomPromocaoCalculavel,
  RegraPromocaoCalculavel,
  RegraSubtotalPromocaoCalculavel,
  TipoDescontoPromocao,
  VinculoCategoriaPromocaoCalculavel,
  VinculoMarcaPromocaoCalculavel,
  VinculoProdutoPromocaoCalculavel,
} from "../types/promocoes.types";

const produtoPromocionalId = "11111111-1111-4111-8111-111111111111";
const produtoSemPromocaoId = "22222222-2222-4222-8222-222222222222";
const categoriaPromocionalId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const marcaPromocionalId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const dataReferencia = new Date("2026-06-01T12:00:00.000Z");

function criarRegraPromocao(
  sobrescritas: Partial<RegraPromocaoCalculavel> = {},
): RegraPromocaoCalculavel {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    nome: "Promocao teste",
    slug: "promocao-teste",
    status: "ativa",
    tipoCampanha: "normal",
    tipoBeneficio: "desconto",
    tipoDesconto: "percentual",
    prioridade: 0,
    acumulativa: false,
    dataInicio: new Date("2026-05-01T00:00:00.000Z"),
    dataFim: new Date("2026-06-30T23:59:59.000Z"),
    badgePromocional: null,
    countdownPromocionalDataFim: null,
    ...sobrescritas,
  };
}

function criarVinculoProdutoPromocao(
  regraPromocaoId: string,
  tipoDesconto: TipoDescontoPromocao,
  valorDesconto: number,
  sobrescritas: Partial<VinculoProdutoPromocaoCalculavel> = {},
): VinculoProdutoPromocaoCalculavel {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    regraPromocaoId,
    produtoId: produtoPromocionalId,
    modalidade: null,
    tipoDesconto,
    valorDesconto,
    ...sobrescritas,
  };
}

function criarVinculoCategoriaPromocao(
  regraPromocaoId: string,
  tipoDesconto: TipoDescontoPromocao,
  valorDesconto: number,
  sobrescritas: Partial<VinculoCategoriaPromocaoCalculavel> = {},
): VinculoCategoriaPromocaoCalculavel {
  return {
    id: "12121212-1212-4121-8121-121212121212",
    regraPromocaoId,
    categoriaId: categoriaPromocionalId,
    tipoDesconto,
    valorDesconto,
    ...sobrescritas,
  };
}

function criarVinculoMarcaPromocao(
  regraPromocaoId: string,
  tipoDesconto: TipoDescontoPromocao,
  valorDesconto: number,
  sobrescritas: Partial<VinculoMarcaPromocaoCalculavel> = {},
): VinculoMarcaPromocaoCalculavel {
  return {
    id: "13131313-1313-4131-8131-131313131313",
    regraPromocaoId,
    marcaId: marcaPromocionalId,
    tipoDesconto,
    valorDesconto,
    ...sobrescritas,
  };
}

function criarRegraSubtotalPromocao(
  regraPromocaoId: string,
  tipoDesconto: TipoDescontoPromocao,
  valorDesconto: number,
  sobrescritas: Partial<RegraSubtotalPromocaoCalculavel> = {},
): RegraSubtotalPromocaoCalculavel {
  return {
    id: "14141414-1414-4141-8141-141414141414",
    regraPromocaoId,
    subtotalMinimo: 50000,
    subtotalMaximo: null,
    tipoDesconto,
    valorDesconto,
    ...sobrescritas,
  };
}

function criarCupomPromocao(
  sobrescritas: Partial<CupomPromocaoCalculavel> = {},
): CupomPromocaoCalculavel {
  return {
    id: "15151515-1515-4151-8151-151515151515",
    codigo: "BEMVINDO10",
    nome: "Cupom boas vindas",
    ativo: true,
    tipoDesconto: "percentual",
    valorDesconto: 10,
    freteGratis: false,
    prioridade: 0,
    acumulativo: false,
    subtotalMinimo: 0,
    limiteUsoTotal: null,
    limiteUsoPorCliente: null,
    totalUsos: 0,
    usosCliente: 0,
    dataInicio: new Date("2026-05-01T00:00:00.000Z"),
    dataFim: new Date("2026-06-30T23:59:59.000Z"),
    ...sobrescritas,
  };
}

describe("calcularPromocoes", () => {
  it("aplica promocao percentual para produto vinculado", async () => {
    const regra = criarRegraPromocao();
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      regras: [regra],
      produtosPromocao: [
        criarVinculoProdutoPromocao(regra.id, "percentual", 10),
      ],
      contexto: { dataReferencia },
    });

    assert.equal(resultado.itens[0]?.preco_original, 10000);
    assert.equal(resultado.itens[0]?.preco_final, 9000);
    assert.equal(resultado.itens[0]?.desconto_aplicado, 1000);
    assert.equal(resultado.itens[0]?.regra_aplicada, regra.id);
    assert.equal(resultado.itens[0]?.tipo_desconto, "percentual");
    assert.equal(resultado.itens[0]?.valor_desconto, 10);
    assert.equal(resultado.itens[0]?.escopo_promocao, "produto");
  });

  it("aplica promocao somente na modalidade vinculada", async () => {
    const regra = criarRegraPromocao();
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          modalidade: "stock",
          quantidade: 1,
          precoBaseEmCentavos: 51900,
        },
        {
          produtoId: produtoPromocionalId,
          modalidade: "dropshipping",
          quantidade: 1,
          precoBaseEmCentavos: 49900,
        },
      ],
      regras: [regra],
      produtosPromocao: [
        criarVinculoProdutoPromocao(regra.id, "valor_fixo", 12000, {
          modalidade: "dropshipping",
        }),
      ],
      contexto: { dataReferencia },
    });

    assert.equal(resultado.itens[0]?.preco_final, 51900);
    assert.equal(resultado.itens[0]?.regra_aplicada, null);
    assert.equal(resultado.itens[1]?.preco_final, 37900);
    assert.equal(resultado.itens[1]?.regra_aplicada, regra.id);
  });

  it("aplica promocao sem modalidade em todas as modalidades do produto", async () => {
    const regra = criarRegraPromocao();
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          modalidade: "stock",
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
        {
          produtoId: produtoPromocionalId,
          modalidade: "dropshipping",
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      regras: [regra],
      produtosPromocao: [
        criarVinculoProdutoPromocao(regra.id, "percentual", 10),
      ],
      contexto: { dataReferencia },
    });

    assert.equal(resultado.itens[0]?.preco_final, 9000);
    assert.equal(resultado.itens[1]?.preco_final, 9000);
  });

  it("retorna metadados oficiais de campanha relampago", async () => {
    const dataFimRelampago = new Date("2026-06-02T23:59:59.000Z");
    const regra = criarRegraPromocao({
      tipoCampanha: "relampago",
      badgePromocional: "Oferta relâmpago",
      countdownPromocionalDataFim: dataFimRelampago,
    });
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      regras: [regra],
      produtosPromocao: [
        criarVinculoProdutoPromocao(regra.id, "percentual", 10),
      ],
      contexto: { dataReferencia },
    });

    assert.equal(resultado.itens[0]?.tipoCampanha, "relampago");
    assert.equal(resultado.itens[0]?.badgePromocional, "Oferta relâmpago");
    assert.equal(
      resultado.itens[0]?.countdownPromocionalDataFim?.toISOString(),
      dataFimRelampago.toISOString(),
    );
    assert.equal(resultado.regrasAplicadas[0]?.tipoCampanha, "relampago");
  });

  it("aplica promocao percentual por categoria", async () => {
    const regra = criarRegraPromocao();
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          categoriaId: categoriaPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 20000,
        },
      ],
      regras: [regra],
      categoriasPromocao: [
        criarVinculoCategoriaPromocao(regra.id, "percentual", 15),
      ],
      contexto: { dataReferencia },
    });

    assert.equal(resultado.itens[0]?.preco_final, 17000);
    assert.equal(resultado.itens[0]?.desconto_aplicado, 3000);
    assert.equal(resultado.itens[0]?.escopo_promocao, "categoria");
  });

  it("aplica promocao de valor fixo por marca", async () => {
    const regra = criarRegraPromocao({ tipoDesconto: "valor_fixo" });
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          marcaId: marcaPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 20000,
        },
      ],
      regras: [regra],
      marcasPromocao: [criarVinculoMarcaPromocao(regra.id, "valor_fixo", 3500)],
      contexto: { dataReferencia },
    });

    assert.equal(resultado.itens[0]?.preco_final, 16500);
    assert.equal(resultado.itens[0]?.desconto_aplicado, 3500);
    assert.equal(resultado.itens[0]?.escopo_promocao, "marca");
  });

  it("aplica promocao por subtotal quando faixa e atendida", async () => {
    const regra = criarRegraPromocao();
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 80000,
        },
      ],
      regras: [regra],
      subtotaisPromocao: [
        criarRegraSubtotalPromocao(regra.id, "percentual", 5),
      ],
      contexto: { dataReferencia, subtotalEmCentavos: 80000 },
    });

    assert.equal(resultado.itens[0]?.preco_final, 76000);
    assert.equal(resultado.itens[0]?.desconto_aplicado, 4000);
    assert.equal(resultado.itens[0]?.escopo_promocao, "subtotal");
  });

  it("ignora promocao por subtotal fora da faixa", async () => {
    const regra = criarRegraPromocao();
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 20000,
        },
      ],
      regras: [regra],
      subtotaisPromocao: [
        criarRegraSubtotalPromocao(regra.id, "percentual", 5),
      ],
      contexto: { dataReferencia, subtotalEmCentavos: 20000 },
    });

    assert.equal(resultado.itens[0]?.preco_final, 20000);
    assert.equal(resultado.itens[0]?.regra_aplicada, null);
  });

  it("aplica cupom percentual quando codigo e valido", async () => {
    const cupom = criarCupomPromocao();
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      cuponsPromocao: [cupom],
      contexto: {
        dataReferencia,
        subtotalEmCentavos: 10000,
        codigosCupons: ["bemvindo10"],
      },
    });

    assert.equal(resultado.itens[0]?.preco_final, 9000);
    assert.equal(resultado.itens[0]?.escopo_promocao, "cupom");
    assert.equal(resultado.regrasAplicadas[0]?.codigoCupom, cupom.codigo);
  });

  it("aplica cupom valor fixo sem deixar preco negativo", async () => {
    const cupom = criarCupomPromocao({
      tipoDesconto: "valor_fixo",
      valorDesconto: 12000,
    });
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      cuponsPromocao: [cupom],
      contexto: {
        dataReferencia,
        subtotalEmCentavos: 10000,
        codigosCupons: [cupom.codigo],
      },
    });

    assert.equal(resultado.itens[0]?.preco_final, 0);
    assert.equal(resultado.itens[0]?.desconto_aplicado, 10000);
  });

  it("ignora cupom com subtotal minimo nao atendido", async () => {
    const cupom = criarCupomPromocao({ subtotalMinimo: 50000 });
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      cuponsPromocao: [cupom],
      contexto: {
        dataReferencia,
        subtotalEmCentavos: 10000,
        codigosCupons: [cupom.codigo],
      },
    });

    assert.equal(resultado.itens[0]?.preco_final, 10000);
    assert.equal(resultado.itens[0]?.regra_aplicada, null);
  });

  it("escolhe maior beneficio entre promocao normal e cupom", async () => {
    const regra = criarRegraPromocao();
    const cupom = criarCupomPromocao({
      id: "16161616-1616-4161-8161-161616161616",
      codigo: "MAIOR25",
      valorDesconto: 25,
    });
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      regras: [regra],
      produtosPromocao: [
        criarVinculoProdutoPromocao(regra.id, "percentual", 10),
      ],
      cuponsPromocao: [cupom],
      contexto: {
        dataReferencia,
        subtotalEmCentavos: 10000,
        codigosCupons: [cupom.codigo],
      },
    });

    assert.equal(resultado.itens[0]?.preco_final, 7500);
    assert.equal(resultado.itens[0]?.escopo_promocao, "cupom");
  });

  it("usa prioridade como desempate entre multiplos cupons", async () => {
    const cupomPrioridadeBaixa = criarCupomPromocao({
      id: "17171717-1717-4171-8171-171717171717",
      codigo: "CUPOM10",
      prioridade: 1,
    });
    const cupomPrioridadeAlta = criarCupomPromocao({
      id: "18181818-1818-4181-8181-181818181818",
      codigo: "VIP10",
      prioridade: 20,
    });
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      cuponsPromocao: [cupomPrioridadeBaixa, cupomPrioridadeAlta],
      contexto: {
        dataReferencia,
        subtotalEmCentavos: 10000,
        codigosCupons: ["CUPOM10", "VIP10"],
      },
    });

    assert.equal(resultado.itens[0]?.regra_aplicada, cupomPrioridadeAlta.id);
    assert.equal(resultado.regrasAplicadas[0]?.codigoCupom, "VIP10");
  });

  it("aplica promocao de valor fixo sem deixar preco negativo", async () => {
    const regra = criarRegraPromocao({ tipoDesconto: "valor_fixo" });
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 5000,
        },
      ],
      regras: [regra],
      produtosPromocao: [
        criarVinculoProdutoPromocao(regra.id, "valor_fixo", 7000),
      ],
      contexto: { dataReferencia },
    });

    assert.equal(resultado.itens[0]?.preco_final, 0);
    assert.equal(resultado.itens[0]?.desconto_aplicado, 5000);
    assert.equal(resultado.itens[0]?.tipo_desconto, "valor_fixo");
    assert.equal(resultado.itens[0]?.valor_desconto, 7000);
  });

  it("ignora promocao expirada", async () => {
    const regra = criarRegraPromocao({
      dataFim: new Date("2026-05-01T00:00:00.000Z"),
    });
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      regras: [regra],
      produtosPromocao: [
        criarVinculoProdutoPromocao(regra.id, "percentual", 20),
      ],
      contexto: { dataReferencia },
    });

    assert.equal(resultado.itens[0]?.preco_final, 10000);
    assert.equal(resultado.itens[0]?.regra_aplicada, null);
  });

  it("escolhe maior beneficio entre multiplas promocoes", async () => {
    const regraMenor = criarRegraPromocao({
      id: "55555555-5555-4555-8555-555555555555",
      nome: "Promocao menor",
      prioridade: 100,
    });
    const regraMaior = criarRegraPromocao({
      id: "66666666-6666-4666-8666-666666666666",
      nome: "Promocao maior",
      prioridade: 1,
    });
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      regras: [regraMenor, regraMaior],
      produtosPromocao: [
        criarVinculoProdutoPromocao(regraMenor.id, "percentual", 10, {
          id: "77777777-7777-4777-8777-777777777777",
        }),
        criarVinculoProdutoPromocao(regraMaior.id, "valor_fixo", 2500, {
          id: "88888888-8888-4888-8888-888888888888",
        }),
      ],
      contexto: { dataReferencia },
    });

    assert.equal(resultado.itens[0]?.regra_aplicada, regraMaior.id);
    assert.equal(resultado.itens[0]?.desconto_aplicado, 2500);
  });

  it("usa prioridade como desempate quando beneficio e igual", async () => {
    const regraPrioridadeBaixa = criarRegraPromocao({
      id: "99999999-9999-4999-8999-999999999999",
      prioridade: 1,
    });
    const regraPrioridadeAlta = criarRegraPromocao({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      prioridade: 10,
    });
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoPromocionalId,
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      regras: [regraPrioridadeBaixa, regraPrioridadeAlta],
      produtosPromocao: [
        criarVinculoProdutoPromocao(
          regraPrioridadeBaixa.id,
          "valor_fixo",
          1000,
          { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
        ),
        criarVinculoProdutoPromocao(regraPrioridadeAlta.id, "percentual", 10, {
          id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        }),
      ],
      contexto: { dataReferencia },
    });

    assert.equal(resultado.itens[0]?.regra_aplicada, regraPrioridadeAlta.id);
    assert.equal(resultado.itens[0]?.desconto_aplicado, 1000);
  });

  it("mantem produto sem promocao com preco original", async () => {
    const regra = criarRegraPromocao();
    const resultado = await calcularPromocoes({
      itens: [
        {
          produtoId: produtoSemPromocaoId,
          quantidade: 1,
          precoBaseEmCentavos: 10000,
        },
      ],
      regras: [regra],
      produtosPromocao: [
        criarVinculoProdutoPromocao(regra.id, "percentual", 15),
      ],
      contexto: { dataReferencia },
    });

    assert.equal(resultado.itens[0]?.preco_final, 10000);
    assert.equal(resultado.itens[0]?.desconto_aplicado, 0);
    assert.equal(resultado.itens[0]?.regra_aplicada, null);
  });
});
