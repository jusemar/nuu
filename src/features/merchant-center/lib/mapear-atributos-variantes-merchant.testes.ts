import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { VarianteFonteMerchant } from "../types/item-merchant";
import {
  mapearAtributosGrupoVariantesMerchant,
  validarGrupoVariantesMerchant,
} from "./mapear-atributos-variantes-merchant";

function variante(
  id: string,
  attributes: Record<string, string>,
): VarianteFonteMerchant {
  return {
    id,
    sku: id,
    name: null,
    attributes,
    priceInCents: 1000,
    comparePriceInCents: null,
    stockQuantity: 1,
    weightInGrams: null,
    heightInCm: null,
    widthInCm: null,
    lengthInCm: null,
    imageUrl: null,
    isActive: true,
    isDefault: false,
    identificadoresCatalogo: [],
    classificacoesLogisticas: [],
  };
}

describe("atributos de variantes Merchant", () => {
  it("mapeia cor e tamanho somente por aliases explícitos", () => {
    const resultado = mapearAtributosGrupoVariantesMerchant([
      variante("v1", { Cor: "Azul", Tamanho: "P" }),
      variante("v2", { Cor: "Verde", Tamanho: "M" }),
    ]);
    assert.equal(resultado.get("v1")?.color, "Azul");
    assert.equal(resultado.get("v1")?.size, "P");
    assert.deepEqual(resultado.get("v2")?.variantOptions, [
      { name: "Cor", value: "Verde" },
      { name: "Tamanho", value: "M" },
    ]);
  });

  it("mantém capacidade e voltagem apenas como opções customizadas", () => {
    const resultado = mapearAtributosGrupoVariantesMerchant([
      variante("v1", { Capacidade: "128 GB", Voltagem: "110 V" }),
      variante("v2", { Capacidade: "256 GB", Voltagem: "220 V" }),
    ]);
    assert.equal(resultado.get("v1")?.color, undefined);
    assert.equal(resultado.get("v1")?.size, undefined);
    assert.deepEqual(resultado.get("v1")?.variantOptions, [
      { name: "Capacidade", value: "128 GB" },
      { name: "Voltagem", value: "110 V" },
    ]);
  });

  it("valida grupo diferenciado somente por tamanho", () => {
    const resultado = validarGrupoVariantesMerchant([
      variante("v1", { Tamanho: "P" }),
      variante("v2", { Tamanho: "M" }),
    ]);
    assert.equal(resultado.valido, true);
    if (resultado.valido) {
      assert.equal(resultado.atributosPorVariante.get("v2")?.size, "M");
    }
  });

  it("preserva uma única variante elegível quando ela possui opção real", () => {
    const resultado = validarGrupoVariantesMerchant([
      variante("v1", { Cor: "Azul" }),
    ]);
    assert.equal(resultado.valido, true);
    if (resultado.valido) {
      assert.deepEqual(
        resultado.atributosPorVariante.get("v1")?.variantOptions,
        [{ name: "Cor", value: "Azul" }],
      );
    }
  });

  it("publica somente dimensões que diferenciam o grupo", () => {
    const resultado = validarGrupoVariantesMerchant([
      variante("v1", { Cor: "Azul", Tamanho: "P", Material: "Algodão" }),
      variante("v2", { Cor: "Azul", Tamanho: "M", Material: "Algodão" }),
    ]);
    assert.equal(resultado.valido, true);
    if (resultado.valido) {
      assert.deepEqual(
        resultado.atributosPorVariante.get("v1")?.variantOptions,
        [{ name: "Tamanho", value: "P" }],
      );
      assert.equal(
        resultado.atributosPorVariante.get("v1")?.material,
        undefined,
      );
    }
  });

  it("diagnostica atributo ausente em parte do grupo", () => {
    const resultado = validarGrupoVariantesMerchant([
      variante("v1", { Cor: "Azul", Tamanho: "P" }),
      variante("v2", { Cor: "Verde" }),
    ]);
    assert.deepEqual(resultado, {
      valido: false,
      motivo: "atributo_diferenciador_ausente",
      detalhes: "A variante v2 não possui: tamanho.",
    });
  });

  it("diagnostica combinações duplicadas", () => {
    const resultado = validarGrupoVariantesMerchant([
      variante("v1", { Cor: "Azul", Tamanho: "P" }),
      variante("v2", { Cor: "Azul", Tamanho: "P" }),
      variante("v3", { Cor: "Verde", Tamanho: "M" }),
    ]);
    assert.equal(resultado.valido, false);
    if (!resultado.valido)
      assert.equal(resultado.motivo, "combinacao_duplicada");
  });

  it("diagnostica grupo sem dimensão suficiente", () => {
    const resultado = validarGrupoVariantesMerchant([
      variante("v1", {}),
      variante("v2", {}),
    ]);
    assert.equal(resultado.valido, false);
    if (!resultado.valido) {
      assert.equal(resultado.motivo, "grupo_sem_dimensao_suficiente");
    }
  });
});
