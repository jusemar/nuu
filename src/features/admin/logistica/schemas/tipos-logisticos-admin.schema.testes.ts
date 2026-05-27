import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  criarRegraTipoLogisticoFreteSchema,
  criarTipoLogisticoSchema,
  vincularProdutoTipoLogisticoSchema,
  vincularVarianteTipoLogisticoSchema,
} from "./tipos-logisticos-admin.schema";

describe("schema tipos logisticos admin", () => {
  it("cria tipo logistico", () => {
    const resultado = criarTipoLogisticoSchema.safeParse({
      identificador: "produto-fragil",
      nome: "Produto Frágil",
      descricao: "Somente transportadora específica",
    });
    assert.equal(resultado.success, true);
  });

  it("vincula produto ao tipo", () => {
    const resultado = vincularProdutoTipoLogisticoSchema.safeParse({
      produtoId: "8c735e85-0ca0-4a81-9210-e05b858cfebc",
      tipoLogisticoId: "8c735e85-0ca0-4a81-9210-e05b858cfebd",
    });
    assert.equal(resultado.success, true);
  });

  it("vincula variante à classificação logística", () => {
    const resultado = vincularVarianteTipoLogisticoSchema.safeParse({
      varianteId: "8c735e85-0ca0-4a81-9210-e05b858cfebe",
      tipoLogisticoId: "8c735e85-0ca0-4a81-9210-e05b858cfebd",
    });
    assert.equal(resultado.success, true);
  });

  it("cria regra por tipo logistico", () => {
    const resultado = criarRegraTipoLogisticoFreteSchema.safeParse({
      tipoLogisticoId: "8c735e85-0ca0-4a81-9210-e05b858cfebd",
      efeito: "bloquear",
      provedorFreteId: null,
      transportadoraFreteId: null,
      servicoFreteId: null,
    });
    assert.equal(resultado.success, true);
  });
});
