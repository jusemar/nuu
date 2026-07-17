import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

import {
  compararVersaoEntidade,
  normalizarVersaoTimestamp,
} from "./concorrencia-alteracao-em-massa";

describe("concorrência da alteração em massa", () => {
  it("detecta alteração externa real e identifica a entidade", () => {
    const conflito = compararVersaoEntidade({
      entidade: "preco",
      esperada: "2026-07-13 01:07:34.171931",
      encontrada: "2026-07-13 01:08:00.000000",
      modalidade: "stock",
    });
    assert.equal(conflito?.entidade, "preco");
    assert.equal(conflito?.campoVersao, "updatedAt");
    assert.match(conflito?.mensagem ?? "", /Estoque Próprio/);
  });

  it("não cria conflito por diferença apenas de serialização ou precisão nula", () => {
    assert.equal(
      normalizarVersaoTimestamp("2026-01-01T00:00:00.123Z"),
      normalizarVersaoTimestamp("2026-01-01 00:00:00.123000"),
    );
    assert.equal(
      compararVersaoEntidade({
        entidade: "produto",
        esperada: "2026-01-01T00:00:00.123Z",
        encontrada: "2026-01-01 00:00:00.123000",
      }),
      null,
    );
  });

  it("aceita nova tentativa quando o novo preview captura a versão atual", () => {
    const atual = "2026-07-13 01:08:00.000001";
    assert.ok(
      compararVersaoEntidade({
        entidade: "produto",
        esperada: "2026-07-13 01:07:34.129537",
        encontrada: atual,
      }),
    );
    assert.equal(
      compararVersaoEntidade({
        entidade: "produto",
        esperada: atual,
        encontrada: atual,
      }),
      null,
    );
  });

  it("usa um placeholder real e não mantém a URL que gerava 404", () => {
    const raiz = process.cwd();
    const fonte = readFileSync(
      resolve(
        raiz,
        "src/features/featured-products-carousel/hooks/useFeaturedProducts.ts",
      ),
      "utf8",
    );
    assert.equal(fonte.includes("/images/product-placeholder.jpg"), false);
    assert.equal(
      existsSync(resolve(raiz, "public/placeholder-product.jpg")),
      true,
    );
  });
});
