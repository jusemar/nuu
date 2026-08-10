import assert from "node:assert/strict";
import test from "node:test";

import {
  derivarEstagioItemImportacaoFornecedor,
  estagioEhTerminalFornecedor,
} from "./estagio-item-importacao-fornecedor";

/** Item vinculado a um produto real, ainda não publicado neste ciclo. */
const vinculado = {
  statusStaging: "localizado",
  criterioLocalizacao: null,
  possuiProdutoVinculado: true,
  publicadoNestaImportacao: false,
};

/**
 * Regressão do que o gestor viu na tela: produto já publicado continuava
 * aparecendo como "Vinculado".
 */
test("publicado NUNCA é apresentado como vinculado", () => {
  const estagio = derivarEstagioItemImportacaoFornecedor({
    ...vinculado,
    publicadoNestaImportacao: true,
  });

  assert.equal(estagio, "publicado");
  assert.notEqual(estagio, "vinculado");
});

test("o vínculo permanente sobrevive à publicação sem mudar o estágio", () => {
  // `possuiProdutoVinculado` continua verdadeiro depois de publicar — é o
  // vínculo permanente. O estágio da importação, não.
  const estagio = derivarEstagioItemImportacaoFornecedor({
    ...vinculado,
    possuiProdutoVinculado: true,
    publicadoNestaImportacao: true,
  });

  assert.equal(estagio, "publicado");
});

test("vinculado e não publicado continua vinculado", () => {
  assert.equal(derivarEstagioItemImportacaoFornecedor(vinculado), "vinculado");
});

test("ignorado é terminal e não volta para a fila", () => {
  const estagio = derivarEstagioItemImportacaoFornecedor({
    ...vinculado,
    statusStaging: "ignorado",
  });

  assert.equal(estagio, "ignorado");
  assert.equal(estagioEhTerminalFornecedor(estagio), true);
});

test("publicado vence ignorado: o ciclo terminou publicando", () => {
  const estagio = derivarEstagioItemImportacaoFornecedor({
    ...vinculado,
    statusStaging: "ignorado",
    publicadoNestaImportacao: true,
  });

  assert.equal(estagio, "publicado");
});

test("marcado como novo produto aparece como novo, não como pendente", () => {
  const estagio = derivarEstagioItemImportacaoFornecedor({
    statusStaging: "nao_localizado",
    criterioLocalizacao: "novo_produto_fornecedor",
    possuiProdutoVinculado: false,
    publicadoNestaImportacao: false,
  });

  assert.equal(estagio, "novo");
});

test("sem vínculo e sem decisão fica pendente", () => {
  assert.equal(
    derivarEstagioItemImportacaoFornecedor({
      statusStaging: "nao_localizado",
      criterioLocalizacao: null,
      possuiProdutoVinculado: false,
      publicadoNestaImportacao: false,
    }),
    "pendente",
  );
});

test("linha com erro de leitura aparece como erro", () => {
  for (const statusStaging of ["erro", "rejeitado"]) {
    assert.equal(
      derivarEstagioItemImportacaoFornecedor({
        ...vinculado,
        statusStaging,
      }),
      "erro",
    );
  }
});

test("só publicado e ignorado são terminais", () => {
  assert.equal(estagioEhTerminalFornecedor("publicado"), true);
  assert.equal(estagioEhTerminalFornecedor("ignorado"), true);
  assert.equal(estagioEhTerminalFornecedor("vinculado"), false);
  assert.equal(estagioEhTerminalFornecedor("pendente"), false);
  assert.equal(estagioEhTerminalFornecedor("novo"), false);
  assert.equal(estagioEhTerminalFornecedor("erro"), false);
});
