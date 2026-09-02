import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizarProdutoLaquila } from "./normalizar-produto-laquila";

describe("normalização de produtos Laquila recebidos", () => {
  it("aceita item válido sem depender de uma classificação estática", () => {
    const item = {
      cd_item: "1104095",
      descricao: "Produto oficial Laquila",
      ds_ggrupo: "PECAS",
      ds_grupo: "PECAS HONDA",
      ds_sgrupo: "CONDOR",
    };

    const produto = normalizarProdutoLaquila(item);

    assert.ok(produto);
    assert.equal(produto.codigoFornecedor, "1104095");
    assert.equal(produto.grupoFornecedor, "PECAS HONDA");
    assert.equal(produto.subgrupoFornecedor, "CONDOR");
    assert.deepEqual(produto.dadosBrutosJson, item);
  });

  it("continua descartando itens sem código ou sem nome", () => {
    assert.equal(normalizarProdutoLaquila({ descricao: "Sem código" }), null);
    assert.equal(normalizarProdutoLaquila({ cd_item: "123" }), null);
  });
});
