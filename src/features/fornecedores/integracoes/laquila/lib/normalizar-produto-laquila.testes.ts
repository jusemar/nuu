import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { prepararLinhaStagingFornecedor } from "@/features/fornecedores/services/validacao-linha-importacao.service";

import {
  identificarAnomaliaPrecoLaquila,
  normalizarDecimalLaquila,
} from "./normalizar-decimal-laquila";
import { normalizarProdutoLaquila } from "./normalizar-produto-laquila";
import { normalizarSaldoPrecoLaquila } from "./normalizar-saldo-preco-laquila";

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

  it("normaliza formatos decimais da API e do histórico brasileiro", () => {
    assert.equal(normalizarDecimalLaquila("2066.48"), "2066.48");
    assert.equal(normalizarDecimalLaquila("4353.85"), "4353.85");
    assert.equal(normalizarDecimalLaquila("2.066,48"), "2066.48");
    assert.equal(normalizarDecimalLaquila("2066"), "2066");
    assert.equal(normalizarDecimalLaquila("332.64"), "332.64");
    assert.equal(normalizarDecimalLaquila("0"), "0");
    assert.equal(normalizarDecimalLaquila(""), null);
    assert.equal(normalizarDecimalLaquila("valor inválido"), null);
    assert.equal(normalizarDecimalLaquila("2.066.48"), null);
  });

  it("preserva preço, peso e dimensões com ponto decimal", () => {
    const produto = normalizarProdutoLaquila({
      cd_item: "1755259",
      descricao: "Capacete HJC",
      vl_preco: "2066.48",
      peso_bruto: "0.024",
      peso_liquido: "0,650",
      altura_caixa: "0.070",
      largura_caixa: "0,590",
      comprimento_caixa: "0.960",
    });

    assert.ok(produto);
    assert.equal(produto.precoFornecedor, "2066.48");
    assert.equal(produto.pesoBruto, "0.024");
    assert.equal(produto.pesoLiquido, "0.650");
    assert.equal(produto.altura, "0.070");
    assert.equal(produto.largura, "0.590");
    assert.equal(produto.comprimento, "0.960");
  });

  it("mantém o contrato de duas casas do saldo e preço", () => {
    assert.deepEqual(
      normalizarSaldoPrecoLaquila({ cd_item: "1755259", vl_preco: "2066.48" }),
      {
        codigoFornecedor: "1755259",
        precoFornecedor: "2066.48",
        estoqueFornecedor: null,
      },
    );
  });

  it("usa os fallbacks de preço Laquila sem deslocar a casa decimal", () => {
    for (const [campo, valor] of [
      ["vl_preco", "2066.48"],
      ["preco", "332.64"],
      ["preco_venda", "4353.85"],
      ["valor", "2.066,48"],
    ] as const) {
      const produto = normalizarProdutoLaquila({
        cd_item: `preco-${campo}`,
        descricao: "Produto Laquila",
        [campo]: valor,
      });

      assert.ok(produto);
      assert.equal(produto.precoFornecedor, normalizarDecimalLaquila(valor));
    }
  });

  it("sinaliza anomalia sem modificar nem bloquear o preço", () => {
    assert.equal(
      identificarAnomaliaPrecoLaquila("206648.00"),
      "acima_do_limite_plausivel",
    );
    assert.equal(identificarAnomaliaPrecoLaquila("2066.48"), null);

    const produto = normalizarProdutoLaquila({
      cd_item: "teste-anomalia",
      descricao: "Produto com preço atípico",
      vl_preco: "206648.00",
    });

    assert.equal(produto?.precoFornecedor, "206648.00");
  });

  it("não altera a normalização original da entrada Excel", () => {
    const base = {
      numeroLinha: 2,
      codigoFornecedor: "excel-1",
      nomeProduto: "Produto Excel",
      categoriaFornecedor: null,
      marcaFornecedor: null,
      estoqueFornecedorOriginal: null,
      linhaVazia: false,
      dadosBrutos: {},
    };

    assert.equal(
      prepararLinhaStagingFornecedor({
        ...base,
        precoFornecedorOriginal: "2.066,48",
      }).precoFornecedor,
      "2066.48",
    );
    assert.equal(
      prepararLinhaStagingFornecedor({
        ...base,
        precoFornecedorOriginal: "2066.48",
      }).precoFornecedor,
      "2066.48",
    );
  });
});
