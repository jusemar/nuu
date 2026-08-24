import assert from "node:assert/strict";
import test from "node:test";

import type { PaginaDinamica } from "@/db/schema";

import {
  filtrarPaginasAssociaveis,
  paginaPodeSerAssociada,
} from "./filtrar-paginas-associaveis";

const data = new Date("2026-01-01T00:00:00Z");
const paginaBase = {
  titulo: "Página",
  slug: "pagina",
  conteudo: { type: "doc", content: [] },
  tituloSeo: null,
  descricaoSeo: null,
  publicadaEm: null,
  createdAt: data,
  updatedAt: data,
} satisfies Omit<PaginaDinamica, "id" | "status">;

test("exclui páginas já associadas e páginas arquivadas", () => {
  const paginas: PaginaDinamica[] = [
    { ...paginaBase, id: "publicada", status: "publicada" },
    { ...paginaBase, id: "rascunho", status: "rascunho" },
    { ...paginaBase, id: "arquivada", status: "arquivada" },
  ];
  assert.deepEqual(
    filtrarPaginasAssociaveis(paginas, ["publicada"]).map(({ id }) => id),
    ["rascunho"],
  );
});

test("recusa explicitamente uma nova associação arquivada", () => {
  assert.equal(paginaPodeSerAssociada("arquivada"), false);
  assert.equal(paginaPodeSerAssociada("rascunho"), true);
  assert.equal(paginaPodeSerAssociada("publicada"), true);
});
