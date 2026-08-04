import assert from "node:assert/strict";
import test from "node:test";

import { normalizarOrdemFaqs, validarEscopoOrdemFaqs } from "./faqs-categoria";

test("normaliza a ordem para índices estáveis e não negativos", () => {
  assert.deepEqual(normalizarOrdemFaqs([{ id: "b" }, { id: "a" }]), [
    { id: "b", orderIndex: 0 },
    { id: "a", orderIndex: 1 },
  ]);
});

test("aceita todas as FAQs da mesma categoria em qualquer ordem", () => {
  assert.doesNotThrow(() =>
    validarEscopoOrdemFaqs(
      ["a", "b"],
      [
        { id: "b", orderIndex: 0 },
        { id: "a", orderIndex: 1 },
      ],
    ),
  );
});

test("rejeita mistura, omissão ou FAQ adicional de outra categoria", () => {
  for (const ordem of [
    [{ id: "a", orderIndex: 0 }],
    [
      { id: "a", orderIndex: 0 },
      { id: "outra", orderIndex: 1 },
    ],
    [
      { id: "a", orderIndex: 0 },
      { id: "b", orderIndex: 1 },
      { id: "extra", orderIndex: 2 },
    ],
  ])
    assert.throws(() => validarEscopoOrdemFaqs(["a", "b"], ordem));
});
