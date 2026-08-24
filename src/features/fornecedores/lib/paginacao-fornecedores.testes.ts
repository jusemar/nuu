import assert from "node:assert/strict";
import test from "node:test";

import {
  calcularPaginacaoFornecedores,
  LIMITE_PADRAO_FORNECEDORES,
  normalizarLimiteFornecedores,
  normalizarPaginaFornecedores,
  offsetInicialFornecedores,
} from "./paginacao-fornecedores";

test("limite fora da lista cai no padrão", () => {
  for (const valor of [7, 1000, 0, -25, "abc", null, undefined]) {
    assert.equal(
      normalizarLimiteFornecedores(valor as never),
      LIMITE_PADRAO_FORNECEDORES,
    );
  }
});

test("limites oferecidos são aceitos, inclusive como texto da URL", () => {
  assert.equal(normalizarLimiteFornecedores(25), 25);
  assert.equal(normalizarLimiteFornecedores("50"), 50);
  assert.equal(normalizarLimiteFornecedores("100"), 100);
});

test("página inválida vira 1", () => {
  for (const valor of [0, -3, "x", null, undefined, 1.7]) {
    const pagina = normalizarPaginaFornecedores(valor as never);
    assert.ok(pagina >= 1, `esperava >= 1 para ${String(valor)}`);
  }
  assert.equal(normalizarPaginaFornecedores("3"), 3);
});

test("685 itens a 25 por página dão 28 páginas", () => {
  const paginacao = calcularPaginacaoFornecedores({
    pagina: 1,
    limite: 25,
    total: 685,
  });

  assert.equal(paginacao.totalPaginas, 28);
  assert.equal(paginacao.offset, 0);
});

test("offset acompanha a página pedida", () => {
  assert.equal(
    calcularPaginacaoFornecedores({ pagina: 3, limite: 25, total: 685 }).offset,
    50,
  );
  assert.equal(
    calcularPaginacaoFornecedores({ pagina: 2, limite: 100, total: 685 })
      .offset,
    100,
  );
});

/**
 * Regressão do caso "página vazia": publicar os itens da última página encolhe
 * o total, e o gestor cairia numa tela em branco.
 */
test("página além do fim cai na última página real", () => {
  const paginacao = calcularPaginacaoFornecedores({
    pagina: 3,
    limite: 25,
    total: 30,
  });

  assert.equal(paginacao.totalPaginas, 2);
  assert.equal(paginacao.pagina, 2);
  assert.equal(paginacao.offset, 25);
});

test("lista vazia continua sendo página 1 de 1, nunca 1 de 0", () => {
  const paginacao = calcularPaginacaoFornecedores({
    pagina: 5,
    limite: 25,
    total: 0,
  });

  assert.equal(paginacao.total, 0);
  assert.equal(paginacao.totalPaginas, 1);
  assert.equal(paginacao.pagina, 1);
  assert.equal(paginacao.offset, 0);
});

test("offset nunca é negativo", () => {
  for (const pagina of [0, -1, "0"]) {
    assert.ok(
      calcularPaginacaoFornecedores({
        pagina: pagina as never,
        limite: 25,
        total: 100,
      }).offset >= 0,
    );
  }
});

test("offset inicial não depende de conhecer o total", () => {
  assert.equal(offsetInicialFornecedores(2, 50), 50);
  assert.equal(offsetInicialFornecedores("4", "25"), 75);
  // Página absurda devolve offset grande; o banco traz zero linhas e o clamp
  // posterior corrige a navegação.
  assert.equal(offsetInicialFornecedores(1000, 25), 24975);
});

test("total exato no limite não cria página sobrando", () => {
  const paginacao = calcularPaginacaoFornecedores({
    pagina: 1,
    limite: 25,
    total: 50,
  });

  assert.equal(paginacao.totalPaginas, 2);
});
