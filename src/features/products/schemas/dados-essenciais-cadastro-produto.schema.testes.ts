import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { dadosEssenciaisCadastroProdutoSchema } from "./dados-essenciais-cadastro-produto.schema";

const valido = {
  name: "Produto de teste",
  slug: "produto-de-teste",
  sku: "TESTE-001",
  description: "Descrição de teste",
  categoryId: "daa4d405-ace1-4929-bd69-80a5c8116ab9",
  images: [],
};

describe("dados obrigatórios no cadastro de produtos", () => {
  for (const productKind of ["simple", "variable"] as const) {
    it(`aceita cadastro ${productKind} completo`, () => {
      const resultado = dadosEssenciaisCadastroProdutoSchema.safeParse({
        ...valido,
        productKind,
      });
      assert.equal(resultado.success, true);
    });
  }

  for (const campo of ["name", "slug", "sku", "description"] as const) {
    it(`rejeita ${campo} vazio ou composto de espaços`, () => {
      for (const valor of ["", "   ", "\t\n"]) {
        const resultado = dadosEssenciaisCadastroProdutoSchema.safeParse({
          ...valido,
          [campo]: valor,
        });
        assert.equal(resultado.success, false);
      }
    });
  }

  it("rejeita categoria inválida e imagens malformadas", () => {
    assert.equal(
      dadosEssenciaisCadastroProdutoSchema.safeParse({
        ...valido,
        categoryId: "",
      }).success,
      false,
    );
    assert.equal(
      dadosEssenciaisCadastroProdutoSchema.safeParse({
        ...valido,
        images: null,
      }).success,
      false,
    );
  });
});
