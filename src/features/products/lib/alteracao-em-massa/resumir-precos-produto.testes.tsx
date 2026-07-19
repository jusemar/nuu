import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CelulaPrecosProduto } from "../../components/admin/alteracao-em-massa/celula-precos-produto";
import type { PrecoModalidadeProduto } from "../../types/alteracao-em-massa.types";
import { resumirPrecosProduto } from "./resumir-precos-produto";

const agora = new Date("2026-01-01T00:00:00.000Z");
const preco = (
  id: string,
  modalidade: PrecoModalidadeProduto["modalidade"],
  precoEmCentavos: number,
  prazo: string | null = null,
): PrecoModalidadeProduto => ({
  id,
  modalidade,
  precoEmCentavos,
  prazo,
  atualizadoEm: agora,
  versaoConcorrencia: "1",
});

describe("preços da alteração em massa", () => {
  it("exibe um produto somente com Estoque Próprio", () => {
    const resultado = resumirPrecosProduto([
      preco("stock", "stock", 12_990, "2–3 dias úteis"),
    ]);
    assert.equal(resultado.length, 1);
    assert.equal(resultado[0].rotulo, "Estoque Próprio");
    assert.match(resultado[0].valorFormatado, /129,90/);
  });

  it("preserva duas modalidades com seus próprios valores", () => {
    const resultado = resumirPrecosProduto([
      preco("stock", "stock", 12_990),
      preco("drop", "dropshipping", 13_990),
    ]);
    assert.deepEqual(
      resultado.map((item) => item.modalidade),
      ["stock", "dropshipping"],
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

  it("mostra o prazo real da modalidade", () => {
    const [resultado] = resumirPrecosProduto([
      preco("pre", "preSale", 12_490, " 5–7 dias úteis "),
    ]);
    assert.equal(resultado.prazoFormatado, "5–7 dias úteis");
  });

  it("informa discretamente quando o prazo está vazio", () => {
    const [resultado] = resumirPrecosProduto([
      preco("drop", "dropshipping", 13_990, "   "),
    ]);
    assert.equal(resultado.prazoFormatado, "Prazo não informado");
  });

  it("mostra o estado vazio quando não existem preços", () => {
    const html = renderToStaticMarkup(<CelulaPrecosProduto precos={[]} />);
    assert.match(html, /Nenhum preço cadastrado/);
  });

  it("não substitui o preço normal por preço promocional", () => {
    const registro = {
      ...preco("stock", "stock", 12_990),
      promoPrice: 9_990,
    };
    const [resultado] = resumirPrecosProduto([registro]);
    assert.match(resultado.valorFormatado, /129,90/);
    assert.doesNotMatch(resultado.valorFormatado, /99,90/);
  });

  it("mantém todos os dados visíveis e o grid responsivo", () => {
    const html = renderToStaticMarkup(
      <CelulaPrecosProduto
        precos={[
          preco("stock", "stock", 12_990, "Imediato"),
          preco("pre", "preSale", 12_490, "3 dias"),
          preco("drop", "dropshipping", 13_990, "5 dias"),
          preco("order", "orderBasis", 14_990, null),
        ]}
      />,
    );
    assert.match(html, /grid-cols-1/);
    assert.match(html, /sm:grid-cols-2/);
    assert.match(html, /xl:grid-cols-4/);
    assert.match(html, /Estoque Próprio/);
    assert.match(html, /Sob encomenda/);
    assert.match(html, /Prazo não informado/);
  });

  it("mantém uma única consulta em lote para product_pricing", () => {
    const fonte = readFileSync(
      new URL(
        "../../queries/alteracao-em-massa/listar-dados-alteracao-em-massa.ts",
        import.meta.url,
      ),
      "utf8",
    );
    assert.equal(fonte.match(/\.from\(productPricingTable\)/g)?.length, 1);
    assert.match(
      fonte,
      /inArray\(productPricingTable\.productId, idsProdutos\)/,
    );
    assert.doesNotMatch(fonte, /promoPrice|promo_price_in_cents/);
  });
});
