import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ConteudoPaginaDinamica } from "./conteudo-pagina-dinamica";

test("renderiza a allowlist sem HTML livre e preserva a hierarquia do h1", () => {
  const html = renderToStaticMarkup(
    <ConteudoPaginaDinamica
      conteudo={{
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Seção" }],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Texto " },
              { type: "text", text: "forte", marks: [{ type: "bold" }] },
              {
                type: "text",
                text: " seguro",
                marks: [
                  { type: "link", attrs: { href: "https://example.com" } },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "<script>alert(1)</script>" }],
          },
        ],
      }}
    />,
  );
  assert.match(html, /<h2/);
  assert.doesNotMatch(html, /<h1/);
  assert.match(html, /<strong>forte<\/strong>/);
  assert.match(html, /href="https:\/\/example.com"/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /dangerouslySetInnerHTML|<script>alert/);
});
