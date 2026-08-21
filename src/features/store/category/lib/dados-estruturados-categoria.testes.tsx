import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { DadosEstruturadosCategoria } from "../components/dados-estruturados-categoria";
import { montarBreadcrumbListCategoria } from "./dados-estruturados-categoria";

test("BreadcrumbList de categoria contém Home e categoria na ordem correta", () => {
  const resultado = montarBreadcrumbListCategoria([
    { id: "categoria", name: "Colchões", slug: "colchoes" },
  ]);

  assert.equal(resultado["@context"], "https://schema.org");
  assert.equal(resultado["@type"], "BreadcrumbList");
  assert.deepEqual(
    resultado.itemListElement.map(({ position, name }) => ({ position, name })),
    [
      { position: 1, name: "Home" },
      { position: 2, name: "Colchões" },
    ],
  );
  assert.match(resultado.itemListElement[0].item, /^https?:\/\//);
  assert.match(resultado.itemListElement[1].item, /\/category\/colchoes$/);
});

test("BreadcrumbList de subcategoria preserva todos os ancestrais", () => {
  const resultado = montarBreadcrumbListCategoria([
    { id: "pai", name: "Colchões", slug: "colchoes" },
    { id: "filha", name: "Espuma", slug: "colchao-de-espuma" },
  ]);

  assert.deepEqual(
    resultado.itemListElement.map((item) => [item.position, item.name]),
    [
      [1, "Home"],
      [2, "Colchões"],
      [3, "Espuma"],
    ],
  );
  assert.match(
    resultado.itemListElement[2].item,
    /\/category\/colchao-de-espuma$/,
  );
});

test("componente server-side emite JSON-LD válido e neutraliza HTML persistido", () => {
  const html = renderToStaticMarkup(
    <DadosEstruturadosCategoria
      breadcrumb={[
        {
          id: "categoria",
          name: "</script><script>alert(1)</script>",
          slug: "categoria-segura",
        },
      ]}
    />,
  );
  const conteudo = html.match(
    /<script type="application\/ld\+json">(.*)<\/script>/,
  )?.[1];

  assert.ok(conteudo);
  assert.doesNotMatch(conteudo, /<script>/);
  const json = JSON.parse(conteudo);
  assert.equal(json["@type"], "BreadcrumbList");
  assert.equal(json.itemListElement.length, 2);
});
