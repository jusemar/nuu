import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buscarPromocoesValidas,
  type ClienteBancoPromocoes,
} from "./buscar-promocoes-validas";
import type { TipoDescontoPromocao } from "../types/promocoes.types";

type RegistrosBancoPromocoes = Awaited<
  ReturnType<ClienteBancoPromocoes["query"]["regrasPromocaoTable"]["findMany"]>
>;
type RegistroBancoPromocao = RegistrosBancoPromocoes[number];
type RegistroBancoProdutoPromocao = NonNullable<
  RegistroBancoPromocao["produtos"]
>[number];
type RegistroBancoCategoriaPromocao = NonNullable<
  RegistroBancoPromocao["categorias"]
>[number];
type RegistroBancoMarcaPromocao = NonNullable<
  RegistroBancoPromocao["marcas"]
>[number];
type RegistroBancoSubtotalPromocao = NonNullable<
  RegistroBancoPromocao["subtotais"]
>[number];
type RegistroBancoCupomPromocao = Awaited<
  ReturnType<ClienteBancoPromocoes["query"]["cuponsPromocaoTable"]["findMany"]>
>[number];

const dataReferencia = new Date("2026-06-01T12:00:00.000Z");
const produtoPromocionalId = "11111111-1111-4111-8111-111111111111";
const categoriaPromocionalId = "77777777-7777-4777-8777-777777777777";
const marcaPromocionalId = "88888888-8888-4888-8888-888888888888";

function criarProdutoPromocaoBanco(
  regraPromocaoId: string,
  sobrescritas: Partial<RegistroBancoProdutoPromocao> = {},
): RegistroBancoProdutoPromocao {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    regraPromocaoId,
    produtoId: produtoPromocionalId,
    modalidade: null,
    tipoDesconto: "percentual",
    valorDesconto: 10,
    criadoEm: new Date("2026-05-01T00:00:00.000Z"),
    ...sobrescritas,
  };
}

function criarCategoriaPromocaoBanco(
  regraPromocaoId: string,
  sobrescritas: Partial<RegistroBancoCategoriaPromocao> = {},
): RegistroBancoCategoriaPromocao {
  return {
    id: "99999999-9999-4999-8999-999999999999",
    regraPromocaoId,
    categoriaId: categoriaPromocionalId,
    tipoDesconto: "percentual",
    valorDesconto: 15,
    criadoEm: new Date("2026-05-01T00:00:00.000Z"),
    ...sobrescritas,
  };
}

function criarMarcaPromocaoBanco(
  regraPromocaoId: string,
  sobrescritas: Partial<RegistroBancoMarcaPromocao> = {},
): RegistroBancoMarcaPromocao {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    regraPromocaoId,
    marcaId: marcaPromocionalId,
    tipoDesconto: "valor_fixo",
    valorDesconto: 2500,
    criadoEm: new Date("2026-05-01T00:00:00.000Z"),
    ...sobrescritas,
  };
}

function criarSubtotalPromocaoBanco(
  regraPromocaoId: string,
  sobrescritas: Partial<RegistroBancoSubtotalPromocao> = {},
): RegistroBancoSubtotalPromocao {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    regraPromocaoId,
    subtotalMinimo: 50000,
    subtotalMaximo: null,
    tipoDesconto: "percentual",
    valorDesconto: 5,
    criadoEm: new Date("2026-05-01T00:00:00.000Z"),
    ...sobrescritas,
  };
}

function criarPromocaoBanco(
  sobrescritas: Partial<RegistroBancoPromocao> = {},
): RegistroBancoPromocao {
  const id = sobrescritas.id ?? "33333333-3333-4333-8333-333333333333";

  return {
    id,
    nome: "Promocao banco",
    slug: "promocao-banco",
    status: "ativa",
    tipoCampanha: "normal",
    tipoBeneficio: "desconto",
    tipoDesconto: "percentual" as TipoDescontoPromocao,
    prioridade: 0,
    acumulativa: false,
    dataInicio: new Date("2026-05-01T00:00:00.000Z"),
    dataFim: new Date("2026-06-30T23:59:59.000Z"),
    badgePromocional: null,
    countdownPromocionalDataFim: null,
    criadoEm: new Date("2026-05-01T00:00:00.000Z"),
    atualizadoEm: new Date("2026-05-01T00:00:00.000Z"),
    produtos: [criarProdutoPromocaoBanco(id)],
    categorias: [],
    marcas: [],
    subtotais: [],
    ...sobrescritas,
  };
}

function criarCupomPromocaoBanco(
  sobrescritas: Partial<RegistroBancoCupomPromocao> = {},
): RegistroBancoCupomPromocao {
  return {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
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
    dataInicio: new Date("2026-05-01T00:00:00.000Z"),
    dataFim: new Date("2026-06-30T23:59:59.000Z"),
    criadoEm: new Date("2026-05-01T00:00:00.000Z"),
    atualizadoEm: new Date("2026-05-01T00:00:00.000Z"),
    usos: [],
    ...sobrescritas,
  };
}

function criarClienteBancoPromocoes(
  registros: RegistrosBancoPromocoes,
  cupons: RegistroBancoCupomPromocao[] = [],
): ClienteBancoPromocoes {
  return {
    query: {
      regrasPromocaoTable: {
        findMany: async () => registros,
      },
      cuponsPromocaoTable: {
        findMany: async () => cupons,
      },
    },
  };
}

describe("buscarPromocoesValidas", () => {
  it("retorna promocoes ativas com produtos vinculados", async () => {
    const regra = criarPromocaoBanco();
    const resultado = await buscarPromocoesValidas({
      dataReferencia,
      clienteBanco: criarClienteBancoPromocoes([regra]),
    });

    assert.equal(resultado.regras.length, 1);
    assert.equal(resultado.regras[0]?.id, regra.id);
    assert.equal(resultado.produtosPromocao.length, 1);
    assert.equal(resultado.produtosPromocao[0]?.regraPromocaoId, regra.id);
  });

  it("retorna promocoes ativas com categorias vinculadas", async () => {
    const regra = criarPromocaoBanco({
      produtos: [],
      categorias: [
        criarCategoriaPromocaoBanco("33333333-3333-4333-8333-333333333333"),
      ],
    });
    const resultado = await buscarPromocoesValidas({
      dataReferencia,
      clienteBanco: criarClienteBancoPromocoes([regra]),
    });

    assert.equal(resultado.regras.length, 1);
    assert.equal(resultado.categoriasPromocao.length, 1);
    assert.equal(
      resultado.categoriasPromocao[0]?.categoriaId,
      categoriaPromocionalId,
    );
  });

  it("retorna promocoes ativas com marcas e subtotais vinculados", async () => {
    const regra = criarPromocaoBanco({
      produtos: [],
      marcas: [criarMarcaPromocaoBanco("33333333-3333-4333-8333-333333333333")],
      subtotais: [
        criarSubtotalPromocaoBanco("33333333-3333-4333-8333-333333333333"),
      ],
    });
    const resultado = await buscarPromocoesValidas({
      dataReferencia,
      clienteBanco: criarClienteBancoPromocoes([regra]),
    });

    assert.equal(resultado.regras.length, 1);
    assert.equal(resultado.marcasPromocao.length, 1);
    assert.equal(resultado.subtotaisPromocao.length, 1);
  });

  it("retorna cupons ativos quando codigo e informado", async () => {
    const cupom = criarCupomPromocaoBanco();
    const resultado = await buscarPromocoesValidas({
      dataReferencia,
      codigosCupons: ["bemvindo10"],
      clienteBanco: criarClienteBancoPromocoes([], [cupom]),
    });

    assert.equal(resultado.cuponsPromocao.length, 1);
    assert.equal(resultado.cuponsPromocao[0]?.codigo, cupom.codigo);
  });

  it("ignora promocoes expiradas", async () => {
    const resultado = await buscarPromocoesValidas({
      dataReferencia,
      clienteBanco: criarClienteBancoPromocoes([
        criarPromocaoBanco({
          dataFim: new Date("2026-05-01T00:00:00.000Z"),
        }),
      ]),
    });

    assert.deepEqual(resultado.regras, []);
    assert.deepEqual(resultado.produtosPromocao, []);
  });

  it("ignora promocoes agendadas", async () => {
    const resultado = await buscarPromocoesValidas({
      dataReferencia,
      clienteBanco: criarClienteBancoPromocoes([
        criarPromocaoBanco({
          status: "agendada",
          dataInicio: new Date("2026-06-10T00:00:00.000Z"),
        }),
      ]),
    });

    assert.deepEqual(resultado.regras, []);
    assert.deepEqual(resultado.produtosPromocao, []);
  });

  it("retorna multiplas promocoes utilizaveis sem duplicidade", async () => {
    const primeiraRegra = criarPromocaoBanco({
      id: "44444444-4444-4444-8444-444444444444",
      prioridade: 5,
    });
    const segundaRegra = criarPromocaoBanco({
      id: "55555555-5555-4555-8555-555555555555",
      prioridade: 10,
      produtos: [
        criarProdutoPromocaoBanco("55555555-5555-4555-8555-555555555555", {
          id: "66666666-6666-4666-8666-666666666666",
          tipoDesconto: "valor_fixo",
          valorDesconto: 1500,
        }),
      ],
    });
    const resultado = await buscarPromocoesValidas({
      dataReferencia,
      clienteBanco: criarClienteBancoPromocoes([
        primeiraRegra,
        segundaRegra,
        primeiraRegra,
      ]),
    });

    assert.equal(resultado.regras.length, 2);
    assert.equal(resultado.produtosPromocao.length, 2);
  });

  it("ignora promocoes sem produtos vinculados", async () => {
    const resultado = await buscarPromocoesValidas({
      dataReferencia,
      clienteBanco: criarClienteBancoPromocoes([
        criarPromocaoBanco({
          produtos: [],
        }),
      ]),
    });

    assert.deepEqual(resultado.regras, []);
    assert.deepEqual(resultado.produtosPromocao, []);
  });
});
