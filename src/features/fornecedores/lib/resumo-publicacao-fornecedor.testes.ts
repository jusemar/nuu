import assert from "node:assert/strict";
import test from "node:test";

import { resumirPublicacaoFornecedor } from "./resumo-publicacao-fornecedor";

test("resume sucesso total", () => {
  assert.deepEqual(resumirPublicacaoFornecedor(5, 5), {
    quantidadeSolicitada: 5,
    quantidadePublicada: 5,
    quantidadeNaoPublicada: 0,
    mensagem: "5 produtos publicados com sucesso.",
  });
});

test("resume publicação parcial com singular correto", () => {
  assert.equal(
    resumirPublicacaoFornecedor(5, 4).mensagem,
    "4 produtos publicados com sucesso. 1 produto requer atenção.",
  );
});

test("resume falha total", () => {
  assert.equal(
    resumirPublicacaoFornecedor(5, 0).mensagem,
    "Nenhum produto foi publicado. Revise os 5 produtos com pendências.",
  );
});
