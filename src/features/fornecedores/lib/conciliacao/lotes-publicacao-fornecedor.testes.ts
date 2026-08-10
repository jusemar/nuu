import assert from "node:assert/strict";
import test from "node:test";

import {
  dividirLotesPublicacaoFornecedor,
  LIMITE_PUBLICACAO_ITEM_A_ITEM,
} from "./lotes-publicacao-fornecedor";

/** Teto que a action aplica em `rascunhoIds` (z.array().max(50)). */
const TETO_DA_ACTION = 50;

function ids(quantidade: number) {
  return Array.from({ length: quantidade }, (_, indice) => `id-${indice}`);
}

test("nada selecionado não gera chamada nenhuma", () => {
  assert.deepEqual(dividirLotesPublicacaoFornecedor([]), []);
});

test("lote pequeno vai de um em um, para o progresso ser exato", () => {
  const lotes = dividirLotesPublicacaoFornecedor(ids(3));

  assert.equal(lotes.length, 3);
  assert.ok(lotes.every((lote) => lote.length === 1));
});

test("no limite ainda é item a item", () => {
  const lotes = dividirLotesPublicacaoFornecedor(
    ids(LIMITE_PUBLICACAO_ITEM_A_ITEM),
  );

  assert.equal(lotes.length, LIMITE_PUBLICACAO_ITEM_A_ITEM);
});

/**
 * Regressão do defeito real: 104 itens aprovados iam numa requisição só e
 * morriam na validação da action, com mensagem genérica.
 */
test("seleção grande nunca estoura o teto da action", () => {
  for (const total of [26, 50, 51, 104, 500]) {
    const lotes = dividirLotesPublicacaoFornecedor(ids(total));

    assert.ok(
      lotes.every((lote) => lote.length <= TETO_DA_ACTION),
      `lote acima do teto com ${total} itens`,
    );
    assert.equal(
      lotes.reduce((soma, lote) => soma + lote.length, 0),
      total,
      `perdeu itens ao dividir ${total}`,
    );
  }
});

test("nenhum item é perdido nem duplicado", () => {
  const originais = ids(104);
  const achatado = dividirLotesPublicacaoFornecedor(originais).flat();

  assert.deepEqual(achatado, originais);
  assert.equal(new Set(achatado).size, originais.length);
});
