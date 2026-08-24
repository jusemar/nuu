import assert from "node:assert/strict";
import test from "node:test";

import { conteudoPaginaDinamicaSchema } from "./conteudo-pagina-dinamica.schema";

test("aceita o contrato mínimo estruturado do editor", () => {
  const conteudo = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Sobre nós" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Nossa história", marks: [{ type: "bold" }] },
        ],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Confiança" }],
              },
            ],
          },
        ],
      },
    ],
  };
  assert.equal(conteudoPaginaDinamicaSchema.safeParse(conteudo).success, true);
});

test("rejeita scripts, HTML, nós e protocolos não autorizados", () => {
  const perigosos = [
    { type: "doc", content: [{ type: "script", text: "alert(1)" }] },
    {
      type: "doc",
      content: [{ type: "html", attrs: { html: "<script>alert(1)</script>" } }],
    },
    {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Clique",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    },
  ];
  for (const conteudo of perigosos)
    assert.equal(
      conteudoPaginaDinamicaSchema.safeParse(conteudo).success,
      false,
    );
});
