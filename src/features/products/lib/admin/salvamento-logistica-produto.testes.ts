import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { omitirLogisticaInalterada } from "./omitir-logistica-inalterada";
import { resolverTiposEntregaCadastro } from "./resolver-tipos-entrega-cadastro";

describe("cadastro: tipos de entrega", () => {
  it("prioriza a seleção da aba Entrega e preserva uma lista vazia intencional", () => {
    assert.deepEqual(
      resolverTiposEntregaCadastro({
        entrega: { tiposEntregaPermitidos: ["supplier", "carrier"] },
        allowedDeliveryTypes: ["own"],
      }),
      ["supplier", "carrier"],
    );
    assert.deepEqual(
      resolverTiposEntregaCadastro({
        entrega: { tiposEntregaPermitidos: [] },
        allowedDeliveryTypes: ["own"],
      }),
      [],
    );
  });

  it("mantém compatibilidade com chamadas antigas e o padrão do produto novo", () => {
    assert.deepEqual(
      resolverTiposEntregaCadastro({ allowedDeliveryTypes: ["carrier"] }),
      ["carrier"],
    );
    assert.deepEqual(resolverTiposEntregaCadastro({}), ["own"]);
  });
});

describe("edição: envio de dados logísticos", () => {
  for (const productKind of ["simple", "variable"] as const) {
    it(`omite logística intacta em produto ${productKind}`, () => {
      const carregado = {
        productKind,
        name: "Antes",
        entrega: {
          disponibilidadeEntregaPropria: "herdar",
          aceitaPagamentoNaEntrega: true,
          precosEntregaPropria: [
            {
              destinationType: "cidade",
              destinationId: 4,
              shippingPrice: 1200,
              rapidDeliveryActive: false,
              scheduledDeliveryActive: true,
              scheduledDeliveryMinDays: 2,
              scheduledDeliveryPrice: 500,
            },
          ],
        },
        dimensoesFreteExterno: { pesoEmKg: "1.000" },
      };
      const enviado = omitirLogisticaInalterada(
        { ...carregado, name: "Depois" },
        carregado,
      );
      assert.equal(enviado.name, "Depois");
      assert.equal("entrega" in enviado, false);
      assert.equal("dimensoesFreteExterno" in enviado, false);
    });
  }

  it("preserva mudanças intencionais de preço, modo e dimensões", () => {
    const carregado = {
      entrega: {
        disponibilidadeEntregaPropria: "ativado",
        precosEntregaPropria: [1200],
      },
      dimensoesFreteExterno: { pesoEmKg: "1" },
    };
    const enviado = omitirLogisticaInalterada(
      {
        entrega: {
          disponibilidadeEntregaPropria: "desativado",
          precosEntregaPropria: [1500],
        },
        dimensoesFreteExterno: { pesoEmKg: "2" },
      },
      carregado,
    );
    assert.equal(enviado.entrega?.disponibilidadeEntregaPropria, "desativado");
    assert.deepEqual(enviado.entrega?.precosEntregaPropria, [1500]);
    assert.equal(enviado.dimensoesFreteExterno?.pesoEmKg, "2");
  });
});
