import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  validarCupomPromocao,
  type ClienteBancoValidacaoCupom,
} from "./validar-cupom-promocao";
import type { TipoDescontoPromocao } from "../types";

type CupomPromocaoBanco = Awaited<
  ReturnType<
    ClienteBancoValidacaoCupom["query"]["cuponsPromocaoTable"]["findFirst"]
  >
>;

type UsoCupomPromocaoBanco = NonNullable<
  NonNullable<CupomPromocaoBanco>["usos"]
>[number];

const dataReferencia = new Date("2026-06-02T12:00:00.000Z");
const clienteId = "11111111-1111-4111-8111-111111111111";

function criarUsoCupom(
  sobrescritas: Partial<UsoCupomPromocaoBanco> = {},
): UsoCupomPromocaoBanco {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    cupomPromocaoId: "33333333-3333-4333-8333-333333333333",
    clienteId,
    pedidoId: null,
    codigoCupom: "BEMVINDO10",
    valorDescontoEmCentavos: 0,
    usadoEm: new Date("2026-06-01T12:00:00.000Z"),
    ...sobrescritas,
  };
}

function criarCupomBanco(
  sobrescritas: Partial<NonNullable<CupomPromocaoBanco>> = {},
): NonNullable<CupomPromocaoBanco> {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    codigo: "BEMVINDO10",
    nome: "Cupom boas-vindas",
    ativo: true,
    tipoDesconto: "percentual" as TipoDescontoPromocao,
    valorDesconto: 10,
    freteGratis: false,
    prioridade: 0,
    acumulativo: false,
    subtotalMinimo: 0,
    limiteUsoTotal: null,
    limiteUsoPorCliente: null,
    totalUsos: 0,
    dataInicio: new Date("2026-06-01T00:00:00.000Z"),
    dataFim: new Date("2026-06-30T23:59:59.000Z"),
    criadoEm: new Date("2026-06-01T00:00:00.000Z"),
    atualizadoEm: new Date("2026-06-01T00:00:00.000Z"),
    usos: [],
    ...sobrescritas,
  };
}

function criarClienteBancoValidacaoCupom(
  cupom: CupomPromocaoBanco,
): ClienteBancoValidacaoCupom {
  return {
    query: {
      cuponsPromocaoTable: {
        findFirst: async () => cupom,
      },
    },
  };
}

describe("validarCupomPromocao", () => {
  it("valida cupom percentual ativo", async () => {
    const resultado = await validarCupomPromocao({
      codigoCupom: "bemvindo10",
      subtotalEmCentavos: 10000,
      dataReferencia,
      clienteBanco: criarClienteBancoValidacaoCupom(criarCupomBanco()),
    });

    assert.equal(resultado.valido, true);
    assert.equal(resultado.codigo, "BEMVINDO10");
    assert.equal(resultado.tipoDesconto, "percentual");
    assert.equal(resultado.valorDesconto, 10);
    assert.equal(resultado.descontoEstimadoEmCentavos, 1000);
  });

  it("retorna invalido quando cupom nao existe", async () => {
    const resultado = await validarCupomPromocao({
      codigoCupom: "naoexiste",
      subtotalEmCentavos: 10000,
      dataReferencia,
      clienteBanco: criarClienteBancoValidacaoCupom(undefined),
    });

    assert.equal(resultado.valido, false);
    assert.equal(resultado.motivoInvalido, "cupom_inexistente");
  });

  it("retorna invalido quando cupom esta inativo", async () => {
    const resultado = await validarCupomPromocao({
      codigoCupom: "BEMVINDO10",
      subtotalEmCentavos: 10000,
      dataReferencia,
      clienteBanco: criarClienteBancoValidacaoCupom(
        criarCupomBanco({ ativo: false }),
      ),
    });

    assert.equal(resultado.valido, false);
    assert.equal(resultado.motivoInvalido, "cupom_inativo");
  });

  it("retorna invalido quando cupom esta expirado", async () => {
    const resultado = await validarCupomPromocao({
      codigoCupom: "BEMVINDO10",
      subtotalEmCentavos: 10000,
      dataReferencia,
      clienteBanco: criarClienteBancoValidacaoCupom(
        criarCupomBanco({ dataFim: new Date("2026-06-01T00:00:00.000Z") }),
      ),
    });

    assert.equal(resultado.valido, false);
    assert.equal(resultado.motivoInvalido, "cupom_expirado");
  });

  it("retorna invalido quando subtotal minimo nao foi atingido", async () => {
    const resultado = await validarCupomPromocao({
      codigoCupom: "BEMVINDO10",
      subtotalEmCentavos: 10000,
      dataReferencia,
      clienteBanco: criarClienteBancoValidacaoCupom(
        criarCupomBanco({ subtotalMinimo: 50000 }),
      ),
    });

    assert.equal(resultado.valido, false);
    assert.equal(resultado.motivoInvalido, "subtotal_insuficiente");
  });

  it("retorna invalido quando limite total foi atingido", async () => {
    const resultado = await validarCupomPromocao({
      codigoCupom: "BEMVINDO10",
      subtotalEmCentavos: 10000,
      dataReferencia,
      clienteBanco: criarClienteBancoValidacaoCupom(
        criarCupomBanco({ limiteUsoTotal: 2, totalUsos: 2 }),
      ),
    });

    assert.equal(resultado.valido, false);
    assert.equal(resultado.motivoInvalido, "limite_total_atingido");
  });

  it("retorna invalido quando limite por cliente foi atingido", async () => {
    const resultado = await validarCupomPromocao({
      codigoCupom: "BEMVINDO10",
      subtotalEmCentavos: 10000,
      clienteId,
      dataReferencia,
      clienteBanco: criarClienteBancoValidacaoCupom(
        criarCupomBanco({
          limiteUsoPorCliente: 1,
          usos: [criarUsoCupom()],
        }),
      ),
    });

    assert.equal(resultado.valido, false);
    assert.equal(resultado.motivoInvalido, "limite_cliente_atingido");
  });
});
