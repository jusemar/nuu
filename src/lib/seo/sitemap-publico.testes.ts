import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { montarSitemapPublico } from "./sitemap-publico";

const atualizacaoCategoria = new Date("2026-08-01T10:00:00.000Z");
const atualizacaoProduto = new Date("2026-08-02T11:00:00.000Z");
const atualizacaoPagina = new Date("2026-08-03T12:00:00.000Z");

test("sitemap contém URLs absolutas de categorias e produtos públicos", () => {
  const resultado = montarSitemapPublico(
    [{ slug: "colchoes", updatedAt: atualizacaoCategoria }],
    [{ slug: "produto-publicado", updatedAt: atualizacaoProduto }],
    [{ slug: "sobre-nos", updatedAt: atualizacaoPagina }],
  );

  assert.equal(resultado.length, 3);
  assert.match(resultado[0].url, /^https?:\/\/.*\/category\/colchoes$/);
  assert.match(resultado[1].url, /^https?:\/\/.*\/product\/produto-publicado$/);
  assert.equal(resultado[0].lastModified, atualizacaoCategoria);
  assert.equal(resultado[1].lastModified, atualizacaoProduto);
  assert.match(resultado[2].url, /^https?:\/\/.*\/sobre-nos$/);
  assert.equal(resultado[2].lastModified, atualizacaoPagina);
});

test("sitemap não produz URLs para slugs vazios ou que alteram a rota", () => {
  const resultado = montarSitemapPublico(
    [
      { slug: "", updatedAt: atualizacaoCategoria },
      { slug: "categoria/invalida", updatedAt: atualizacaoCategoria },
    ],
    [
      { slug: "produto?invalido", updatedAt: atualizacaoProduto },
      { slug: "produto-valido", updatedAt: atualizacaoProduto },
    ],
  );

  assert.equal(resultado.length, 1);
  assert.match(resultado[0].url, /\/product\/produto-valido$/);
});

test("queries do sitemap excluem categorias e produtos não públicos", () => {
  const queryCategorias = readFileSync(
    new URL(
      "../../features/store/category/queries/listar-categorias-publicas-sitemap.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const queryProdutos = readFileSync(
    new URL(
      "../../features/store/products/queries/listar-produtos-publicos-sitemap.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const queryPaginas = readFileSync(
    new URL(
      "../../features/paginas-dinamicas/queries/buscar-pagina-publicada.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(queryCategorias, /eq\(categoryTable\.isActive, true\)/);
  assert.match(queryProdutos, /eq\(productTable\.isActive, true\)/);
  assert.match(queryProdutos, /eq\(productTable\.status, "published"\)/);
  assert.doesNotMatch(queryProdutos, /storeProductFlags|FLAG_CATALOGO/);
  assert.match(
    queryPaginas,
    /eq\(paginasDinamicasTable\.status, "publicada"\)/,
  );
  assert.match(queryPaginas, /slugPaginaEhReservado/);
});
