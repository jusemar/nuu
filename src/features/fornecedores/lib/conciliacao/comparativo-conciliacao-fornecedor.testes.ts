import assert from "node:assert/strict";
import test from "node:test";

import { montarComparativoConciliacaoFornecedor } from "./comparativo-conciliacao-fornecedor";

/** Cenário aprovado do produto já vinculado, com os números da regra. */
const itemVinculado = {
  fornecedor: { preco: "516.16", estoque: 5 },
  lojaAtual: {
    preco: "308.90",
    estoque: 31,
    modalidade: "dropshipping",
    prazo: "3 dias úteis",
  },
  aPublicar: {
    preco: "516.16",
    estoque: 5,
    categoriaNome: "Pneus",
    marcaNome: "Pirelli",
    secoesLoja: ["general"],
    modalidade: "stock",
    prazo: "1 dia útil",
  },
};

function linhaDe(
  linhas: ReturnType<typeof montarComparativoConciliacaoFornecedor>,
  campo: string,
) {
  const linha = linhas.find((item) => item.campo === campo);
  assert.ok(linha, `esperava a linha "${campo}" no comparativo`);
  return linha;
}

test("cobre os sete campos exigidos pela comparação", () => {
  const linhas = montarComparativoConciliacaoFornecedor(itemVinculado);

  assert.deepEqual(
    linhas.map((linha) => linha.campo),
    [
      "Preço",
      "Estoque",
      "Categoria",
      "Marca",
      "Seções",
      "Modalidade",
      "Prazo",
    ],
  );
});

test("preço do fornecedor alimenta o a publicar sem apagar o preço da loja", () => {
  const preco = linhaDe(
    montarComparativoConciliacaoFornecedor(itemVinculado),
    "Preço",
  );

  assert.match(preco.fornecedor, /516,16/);
  assert.match(preco.lojaAtual, /308,90/);
  assert.match(preco.aPublicar, /516,16/);
  assert.equal(preco.muda, true);
});

test("estoque do fornecedor vira o estoque a publicar", () => {
  const estoque = linhaDe(
    montarComparativoConciliacaoFornecedor(itemVinculado),
    "Estoque",
  );

  assert.equal(estoque.fornecedor, "5");
  assert.equal(estoque.lojaAtual, "31");
  assert.equal(estoque.aPublicar, "5");
  assert.equal(estoque.muda, true);
});

test("modalidade e prazo mostram a troca para Estoque próprio e 1 dia útil", () => {
  const linhas = montarComparativoConciliacaoFornecedor(itemVinculado);
  const modalidade = linhaDe(linhas, "Modalidade");
  const prazo = linhaDe(linhas, "Prazo");

  assert.equal(modalidade.lojaAtual, "Dropshipping");
  assert.equal(modalidade.aPublicar, "Estoque próprio");
  assert.equal(modalidade.muda, true);
  assert.equal(prazo.aPublicar, "1 dia útil");
});

test("item novo não inventa estado atual da loja", () => {
  const linhas = montarComparativoConciliacaoFornecedor({
    ...itemVinculado,
    lojaAtual: null,
  });

  for (const linha of linhas) {
    assert.equal(linha.lojaAtual, "—");
    // Sem produto na loja não há "mudança": não existe o que comparar.
    assert.equal(linha.muda, false);
  }
});

test("campo sem decisão aparece como pendente, não como vazio", () => {
  const linhas = montarComparativoConciliacaoFornecedor({
    ...itemVinculado,
    aPublicar: {
      ...itemVinculado.aPublicar,
      categoriaNome: null,
      secoesLoja: [],
    },
  });

  assert.equal(linhaDe(linhas, "Categoria").aPublicar, "Pendente");
  assert.equal(linhaDe(linhas, "Seções").aPublicar, "Pendente");
});
