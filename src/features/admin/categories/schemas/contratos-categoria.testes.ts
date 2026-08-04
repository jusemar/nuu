import assert from "node:assert/strict";
import test from "node:test";

import {
  atualizarFaqCategoriaSchema,
  criarFaqCategoriaSchema,
  reordenarFaqsCategoriaSchema,
} from "./contratos-categoria";

const categoryId = "11111111-1111-4111-8111-111111111111";
const idA = "22222222-2222-4222-8222-222222222222";
const idB = "33333333-3333-4333-8333-333333333333";

test("aceita FAQ válida de categoria raiz ou subcategoria", () => {
  for (const id of [categoryId, "44444444-4444-4444-8444-444444444444"])
    assert.equal(
      criarFaqCategoriaSchema.safeParse({
        answer: "Resposta completa",
        categoryId: id,
        isActive: true,
        orderIndex: 0,
        question: "Qual é a política?",
      }).success,
      true,
    );
});

test("rejeita pergunta vazia, resposta vazia e ordem negativa", () => {
  const base = { answer: "Resposta", categoryId, question: "Pergunta" };
  assert.equal(
    criarFaqCategoriaSchema.safeParse({ ...base, question: " " }).success,
    false,
  );
  assert.equal(
    criarFaqCategoriaSchema.safeParse({ ...base, answer: " " }).success,
    false,
  );
  assert.equal(
    criarFaqCategoriaSchema.safeParse({ ...base, orderIndex: -1 }).success,
    false,
  );
});

test("edição parcial valida somente os campos enviados", () => {
  assert.equal(
    atualizarFaqCategoriaSchema.safeParse({ question: "Nova pergunta" })
      .success,
    true,
  );
  assert.equal(
    atualizarFaqCategoriaSchema.safeParse({ answer: "Nova resposta" }).success,
    true,
  );
});

test("ordem exige índices contíguos, únicos e IDs únicos", () => {
  assert.equal(
    reordenarFaqsCategoriaSchema.safeParse([
      { id: idB, orderIndex: 0 },
      { id: idA, orderIndex: 1 },
    ]).success,
    true,
  );
  for (const invalida of [
    [{ id: idA, orderIndex: -1 }],
    [
      { id: idA, orderIndex: 0 },
      { id: idB, orderIndex: 0 },
    ],
    [
      { id: idA, orderIndex: 0 },
      { id: idA, orderIndex: 1 },
    ],
    [
      { id: idA, orderIndex: 0 },
      { id: idB, orderIndex: 2 },
    ],
  ])
    assert.equal(
      reordenarFaqsCategoriaSchema.safeParse(invalida).success,
      false,
    );
});
