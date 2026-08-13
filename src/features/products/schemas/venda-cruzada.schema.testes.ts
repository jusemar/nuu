import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { salvarVendaCruzadaSchema } from "./venda-cruzada.schema";

const PRINCIPAL = "00000000-0000-4000-8000-000000000001";
const PRODUTOS = [
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
  "00000000-0000-4000-8000-000000000005",
  "00000000-0000-4000-8000-000000000006",
];

describe("contrato administrativo de venda cruzada", () => {
  it("aceita no máximo quatro produtos únicos e ordenados", () => {
    const resultado = salvarVendaCruzadaSchema.safeParse({
      produtoPrincipalId: PRINCIPAL,
      ativa: true,
      produtosIds: PRODUTOS.slice(0, 4),
    });

    assert.equal(resultado.success, true);
  });

  it("recusa mais de quatro vínculos", () => {
    const resultado = salvarVendaCruzadaSchema.safeParse({
      produtoPrincipalId: PRINCIPAL,
      ativa: true,
      produtosIds: PRODUTOS,
    });

    assert.equal(resultado.success, false);
  });

  it("recusa produto duplicado", () => {
    const resultado = salvarVendaCruzadaSchema.safeParse({
      produtoPrincipalId: PRINCIPAL,
      ativa: true,
      produtosIds: [PRODUTOS[0], PRODUTOS[0]],
    });

    assert.equal(resultado.success, false);
  });

  it("recusa autorrelacionamento", () => {
    const resultado = salvarVendaCruzadaSchema.safeParse({
      produtoPrincipalId: PRINCIPAL,
      ativa: true,
      produtosIds: [PRINCIPAL],
    });

    assert.equal(resultado.success, false);
  });
});
