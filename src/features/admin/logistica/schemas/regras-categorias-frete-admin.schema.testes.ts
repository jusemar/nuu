import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  criarRegraCategoriaFreteSchema,
  editarRegraCategoriaFreteSchema,
} from "./regras-categorias-frete-admin.schema";

describe("schema regra categoria frete admin", () => {
  it("valida criacao permitir", () => {
    const resultado = criarRegraCategoriaFreteSchema.safeParse({
      categoriaId: "8c735e85-0ca0-4a81-9210-e05b858cfebc",
      efeito: "permitir",
      provedorFreteId: null,
      transportadoraFreteId: null,
      servicoFreteId: null,
    });
    assert.equal(resultado.success, true);
  });

  it("valida criacao bloquear", () => {
    const resultado = criarRegraCategoriaFreteSchema.safeParse({
      categoriaId: "8c735e85-0ca0-4a81-9210-e05b858cfebc",
      efeito: "bloquear",
      provedorFreteId: null,
      transportadoraFreteId: null,
      servicoFreteId: null,
    });
    assert.equal(resultado.success, true);
  });

  it("valida edicao parcial", () => {
    const resultado = editarRegraCategoriaFreteSchema.safeParse({
      efeito: "bloquear",
    });
    assert.equal(resultado.success, true);
  });
});

