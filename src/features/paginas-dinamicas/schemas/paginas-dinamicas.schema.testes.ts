import assert from "node:assert/strict";
import test from "node:test";

import {
  reordenarPaginasGrupoSchema,
  salvarPaginaDinamicaSchema,
} from "./paginas-dinamicas.schema";

test("aceita conteúdo JSON estruturado e rejeita valores executáveis", () => {
  const base = {
    titulo: "Sobre nós",
    slug: "sobre-nos",
    status: "rascunho" as const,
  };
  assert.equal(
    salvarPaginaDinamicaSchema.safeParse({
      ...base,
      conteudo: { type: "doc", content: [] },
    }).success,
    true,
  );
  assert.equal(
    salvarPaginaDinamicaSchema.safeParse({
      ...base,
      conteudo: { executar: () => true },
    }).success,
    false,
  );
});

test("exige identificadores canônicos e uma ordenação sem duplicatas", () => {
  assert.equal(
    salvarPaginaDinamicaSchema.safeParse({
      titulo: "Página",
      slug: "Slug Inválido",
      conteudo: {},
      status: "rascunho",
    }).success,
    false,
  );
  const id = "c8d49bb7-9141-44ca-9d67-9c1a664cd486";
  assert.equal(
    reordenarPaginasGrupoSchema.safeParse({
      grupoId: id,
      idsPaginasOrdenadas: [id, id],
    }).success,
    false,
  );
});

test("recusa slugs ocupados pelas rotas reais da aplicação", () => {
  assert.equal(
    salvarPaginaDinamicaSchema.safeParse({
      titulo: "Colisão",
      slug: "admin",
      conteudo: { type: "doc", content: [] },
      status: "publicada",
    }).success,
    false,
  );
});
