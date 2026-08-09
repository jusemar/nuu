import assert from "node:assert/strict";
import test from "node:test";

import { origemDaImportacaoFornecedor } from "./origem-importacao-fornecedor";

test("importação de arquivo resolve para a origem de planilha", () => {
  assert.deepEqual(
    origemDaImportacaoFornecedor({ tipoArquivo: "arquivo_excel" }),
    { origemTipo: "fornecedor_excel", origemProvedor: "arquivo_excel" },
  );
});

test("importação de API resolve para o provedor gravado na execução", () => {
  assert.deepEqual(
    origemDaImportacaoFornecedor({
      tipoArquivo: "api",
      configuracaoFluxoJson: { origem: "api", provedor: "laquila" },
    }),
    { origemTipo: "fornecedor_api", origemProvedor: "laquila" },
  );
});

test("API sem provedor gravado não vira importação de arquivo", () => {
  // Execuções antigas podem não ter o provedor; o que não pode acontecer é a
  // API passar a filtrar rascunhos de planilha — seriam de outro ciclo inteiro.
  const origem = origemDaImportacaoFornecedor({
    tipoArquivo: "api",
    configuracaoFluxoJson: {},
  });

  assert.equal(origem.origemTipo, "fornecedor_api");
  assert.equal(origem.origemProvedor, "laquila");
});

test("provedor inválido não sobrescreve a origem da API", () => {
  const origem = origemDaImportacaoFornecedor({
    tipoArquivo: "api",
    configuracaoFluxoJson: { provedor: 42 },
  });

  assert.equal(origem.origemTipo, "fornecedor_api");
  assert.equal(origem.origemProvedor, "laquila");
});
