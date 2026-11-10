import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { productOwnDeliveryPrices } from "@/db/table/logistics/entrega-propria/productOwnDeliveryPrices";

import type { ProductOwnDeliveryPriceFormItem } from "../types/shipping";
import { precosEntregaPropriaAlterados } from "./precos-entrega-propria-alterados";
import { resolverPrecosAtualizacaoProduto } from "./resolver-precos-atualizacao-produto";

type PrecoPersistido = typeof productOwnDeliveryPrices.$inferSelect;

const preco: PrecoPersistido = {
  id: 1,
  productId: "produto",
  destinationType: "cidade",
  regionId: null,
  bairroId: null,
  cepEspecificoId: null,
  cityId: 42,
  shippingPrice: 1590,
  rapidDeliveryActive: false,
  deliveryDeadline: "Até 3 dias",
  scheduledDeliveryActive: true,
  scheduledDeliveryMinDays: 2,
  scheduledDeliveryPrice: 490,
  isActive: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const formulario: ProductOwnDeliveryPriceFormItem = {
  destinationType: "cidade",
  destinationId: 42,
  shippingPrice: 1590,
  rapidDeliveryActive: false,
  deliveryDeadline: "Até 3 dias",
  scheduledDeliveryActive: true,
  scheduledDeliveryMinDays: 2,
  scheduledDeliveryPrice: 490,
  isActive: true,
};

describe("preços de entrega própria", () => {
  it("não envia preços ausentes durante carregamento e mantém remoções intencionais", () => {
    assert.equal(
      resolverPrecosAtualizacaoProduto(undefined, "herdar", false),
      undefined,
    );
    assert.deepEqual(
      resolverPrecosAtualizacaoProduto(undefined, "desativado", false),
      [],
    );
    assert.deepEqual(
      resolverPrecosAtualizacaoProduto(undefined, "ativado", true),
      [],
    );
    assert.deepEqual(
      resolverPrecosAtualizacaoProduto([formulario], "ativado", false),
      [formulario],
    );
  });

  it("não regrava preço igual, inclusive rápida desligada e programada ativa", () => {
    assert.equal(precosEntregaPropriaAlterados([preco], [formulario]), false);
  });

  it("detecta preço, ativação e configuração programada alterados", () => {
    for (const alteracao of [
      { shippingPrice: 1600 },
      { isActive: false },
      { rapidDeliveryActive: true },
      { scheduledDeliveryActive: false },
      { scheduledDeliveryMinDays: 3 },
      { scheduledDeliveryPrice: 590 },
    ]) {
      assert.equal(
        precosEntregaPropriaAlterados(
          [preco],
          [{ ...formulario, ...alteracao }],
        ),
        true,
      );
    }
  });

  it("reconhece remoção intencional e ignora a ordem das linhas", () => {
    assert.equal(precosEntregaPropriaAlterados([preco], []), true);
    const segundo: PrecoPersistido = {
      ...preco,
      id: 2,
      cityId: 43,
      shippingPrice: 1000,
    };
    assert.equal(
      precosEntregaPropriaAlterados(
        [preco, segundo],
        [{ ...formulario, destinationId: 43, shippingPrice: 1000 }, formulario],
      ),
      false,
    );
  });

  it("não remove uma linha legada com destino ausente ao salvar outro campo", () => {
    const legado = { ...preco, cityId: null };
    assert.equal(
      precosEntregaPropriaAlterados(
        [legado],
        [{ ...formulario, destinationId: 0 }],
      ),
      false,
    );
  });
});
