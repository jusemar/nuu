import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  registrarUsoCupomPromocao,
  type ClienteBancoRegistroUsoCupomPromocao,
} from "./registrar-uso-cupom-promocao";

type EstadoBancoTeste = {
  usoInserido: unknown | null;
  totalIncrementosCupom: number;
};

function criarClienteBancoTeste({
  pedido,
  pagamento,
  cupom,
  usoJaRegistrado = false,
}: {
  pedido?: Record<string, unknown>;
  pagamento?: Record<string, unknown>;
  cupom?: Record<string, unknown>;
  usoJaRegistrado?: boolean;
}) {
  const estado: EstadoBancoTeste = {
    usoInserido: null,
    totalIncrementosCupom: 0,
  };
  const clienteBanco = {
    query: {
      checkoutPedidosTable: {
        findFirst: async () => pedido,
      },
      checkoutPagamentosTable: {
        findFirst: async () => pagamento,
      },
      cuponsPromocaoTable: {
        findFirst: async () => cupom,
      },
    },
    insert: () => ({
      values: (valor: unknown) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (usoJaRegistrado) return [];
            estado.usoInserido = valor;
            return [{ id: "uso-1" }];
          },
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: async () => {
          estado.totalIncrementosCupom += 1;
          return [];
        },
      }),
    }),
  } as unknown as ClienteBancoRegistroUsoCupomPromocao;

  return { clienteBanco, estado };
}

describe("registrarUsoCupomPromocao", () => {
  it("registra uso de cupom somente com pedido e pagamento confirmados", async () => {
    const { clienteBanco, estado } = criarClienteBancoTeste({
      pedido: {
        id: "pedido-1",
        clienteId: "cliente-1",
        pagamentoStatus: "paid",
        codigoCupomAplicado: "PROMO10",
        descontoCupomEmCentavos: 1000,
      },
      pagamento: {
        id: "pagamento-1",
        status: "paid",
        paidAt: new Date("2026-06-02T10:00:00.000Z"),
      },
      cupom: {
        id: "cupom-1",
        codigo: "PROMO10",
      },
    });

    const resultado = await registrarUsoCupomPromocao({
      pedidoId: "pedido-1",
      pagamentoId: "pagamento-1",
      clienteBanco,
    });

    assert.equal(resultado.status, "registrado");
    assert.equal(resultado.registrado, true);
    assert.equal(estado.totalIncrementosCupom, 1);
    assert.deepEqual(estado.usoInserido, {
      cupomPromocaoId: "cupom-1",
      clienteId: "cliente-1",
      pedidoId: "pedido-1",
      codigoCupom: "PROMO10",
      valorDescontoEmCentavos: 1000,
      usadoEm: new Date("2026-06-02T10:00:00.000Z"),
    });
  });

  it("nao duplica uso quando pedido e cupom ja foram registrados", async () => {
    const { clienteBanco, estado } = criarClienteBancoTeste({
      usoJaRegistrado: true,
      pedido: {
        id: "pedido-1",
        clienteId: "cliente-1",
        pagamentoStatus: "paid",
        codigoCupomAplicado: "PROMO10",
        descontoCupomEmCentavos: 1000,
      },
      pagamento: {
        id: "pagamento-1",
        status: "paid",
        paidAt: new Date("2026-06-02T10:00:00.000Z"),
      },
      cupom: {
        id: "cupom-1",
        codigo: "PROMO10",
      },
    });

    const resultado = await registrarUsoCupomPromocao({
      pedidoId: "pedido-1",
      pagamentoId: "pagamento-1",
      clienteBanco,
    });

    assert.equal(resultado.status, "ja_registrado");
    assert.equal(resultado.registrado, false);
    assert.equal(estado.totalIncrementosCupom, 0);
  });

  it("ignora pagamento nao confirmado", async () => {
    const { clienteBanco, estado } = criarClienteBancoTeste({
      pedido: {
        id: "pedido-1",
        clienteId: "cliente-1",
        pagamentoStatus: "pending",
        codigoCupomAplicado: "PROMO10",
        descontoCupomEmCentavos: 1000,
      },
    });

    const resultado = await registrarUsoCupomPromocao({
      pedidoId: "pedido-1",
      clienteBanco,
    });

    assert.equal(resultado.status, "pagamento_nao_confirmado");
    assert.equal(estado.totalIncrementosCupom, 0);
  });

  it("ignora pedido sem cupom aplicado", async () => {
    const { clienteBanco, estado } = criarClienteBancoTeste({
      pedido: {
        id: "pedido-1",
        clienteId: "cliente-1",
        pagamentoStatus: "paid",
        codigoCupomAplicado: null,
        descontoCupomEmCentavos: 0,
      },
    });

    const resultado = await registrarUsoCupomPromocao({
      pedidoId: "pedido-1",
      clienteBanco,
    });

    assert.equal(resultado.status, "sem_cupom");
    assert.equal(estado.totalIncrementosCupom, 0);
  });

  it("nao quebra confirmacao quando cupom nao existe mais", async () => {
    const { clienteBanco, estado } = criarClienteBancoTeste({
      pedido: {
        id: "pedido-1",
        clienteId: "cliente-1",
        pagamentoStatus: "paid",
        codigoCupomAplicado: "PROMO10",
        descontoCupomEmCentavos: 1000,
      },
      pagamento: {
        id: "pagamento-1",
        status: "paid",
        paidAt: new Date("2026-06-02T10:00:00.000Z"),
      },
    });

    const resultado = await registrarUsoCupomPromocao({
      pedidoId: "pedido-1",
      pagamentoId: "pagamento-1",
      clienteBanco,
    });

    assert.equal(resultado.status, "cupom_nao_encontrado");
    assert.equal(resultado.registrado, false);
    assert.equal(estado.totalIncrementosCupom, 0);
  });

  it("registra pelo snapshot quando cupom expirou apos criacao do pedido", async () => {
    const { clienteBanco, estado } = criarClienteBancoTeste({
      pedido: {
        id: "pedido-1",
        clienteId: "cliente-1",
        pagamentoStatus: "paid",
        codigoCupomAplicado: "PROMO10",
        descontoCupomEmCentavos: 1000,
      },
      pagamento: {
        id: "pagamento-1",
        status: "paid",
        paidAt: new Date("2026-06-10T10:00:00.000Z"),
      },
      cupom: {
        id: "cupom-1",
        codigo: "PROMO10",
        dataFim: new Date("2026-06-05T23:59:59.000Z"),
      },
    });

    const resultado = await registrarUsoCupomPromocao({
      pedidoId: "pedido-1",
      pagamentoId: "pagamento-1",
      clienteBanco,
    });

    assert.equal(resultado.status, "registrado");
    assert.equal(resultado.registrado, true);
    assert.equal(estado.totalIncrementosCupom, 1);
  });
});
