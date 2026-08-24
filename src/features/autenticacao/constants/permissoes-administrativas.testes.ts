import assert from "node:assert/strict";
import test from "node:test";

import {
  CATALOGO_PERMISSOES_ADMIN,
  ehPermissaoAdministrativaChave,
  PERMISSOES_ADMIN,
} from "./permissoes-administrativas";

test("catálogo possui 29 chaves únicas e válidas", () => {
  const chaves = CATALOGO_PERMISSOES_ADMIN.map(({ chave }) => chave);
  assert.equal(chaves.length, 29);
  assert.equal(new Set(chaves).size, chaves.length);
  for (const chave of chaves) {
    assert.match(chave, /^[a-z0-9_]+[.][a-z0-9_]+$/);
    assert.equal(ehPermissaoAdministrativaChave(chave), true);
  }
});

test("fonte tipada inclui somente a entrada global do Atendente IA", () => {
  assert.equal(PERMISSOES_ADMIN.ATENDENTE_IA.ACESSAR, "atendente_ia.acessar");
  assert.equal(ehPermissaoAdministrativaChave("gestor_principal"), false);
  assert.equal(ehPermissaoAdministrativaChave("revisor"), false);
  assert.equal(ehPermissaoAdministrativaChave("visualizador"), false);
});
