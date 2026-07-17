import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PrecoModalidadeProduto } from "../../types/alteracao-em-massa.types";
import { resumirPrecosProduto } from "./resumir-precos-produto";

const agora = new Date("2026-01-01T00:00:00.000Z");
const preco = (
  id: string,
  modalidade: PrecoModalidadeProduto["modalidade"],
  precoEmCentavos: number,
): PrecoModalidadeProduto => ({
  id,
  modalidade,
  precoEmCentavos,
  prazo: null,
  atualizadoEm: agora,
  versaoConcorrencia: "1",
});

describe("resumo de preços da alteração em massa", () => {
  it("prioriza Estoque Próprio e formata moeda brasileira", () => {
    const resultado = resumirPrecosProduto([
      preco("drop", "dropshipping", 13_990),
      preco("stock", "stock", 12_990),
    ]);
    assert.equal(resultado[0].rotulo, "Estoque Próprio");
    assert.match(resultado[0].valorFormatado, /129,90/);
  });

  it("exibe somente modalidades existentes", () => {
    const resultado = resumirPrecosProduto([preco("pre", "preSale", 12_490)]);
    assert.deepEqual(
      resultado.map((item) => item.rotulo),
      ["Pré-venda"],
    );
  });

  it("mantém as quatro modalidades na ordem central", () => {
    const resultado = resumirPrecosProduto([
      preco("order", "orderBasis", 4),
      preco("drop", "dropshipping", 3),
      preco("pre", "preSale", 2),
      preco("stock", "stock", 1),
    ]);
    assert.deepEqual(
      resultado.map((item) => item.modalidade),
      ["stock", "preSale", "dropshipping", "orderBasis"],
    );
  });
});
