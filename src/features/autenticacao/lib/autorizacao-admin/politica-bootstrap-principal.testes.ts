import assert from "node:assert/strict";
import test from "node:test";

import { decidirBootstrapPrincipal } from "./politica-bootstrap-principal";

test("bootstrap novo cria vínculo ativo principal na versão inicial", () => {
  assert.deepEqual(decidirBootstrapPrincipal(null), {
    tipo: "criar",
    versaoFinal: 1,
  });
});

test("reexecução preserva vínculo correto e não incrementa versão", () => {
  assert.deepEqual(
    decidirBootstrapPrincipal({
      administradorPrincipal: true,
      id: "admin-1",
      status: "ativo",
      versaoAutorizacao: 7,
    }),
    {
      administradorId: "admin-1",
      tipo: "preservar",
      versaoFinal: 7,
    },
  );
});

test("vínculo ativo existente é promovido sem duplicar e incrementa versão", () => {
  assert.deepEqual(
    decidirBootstrapPrincipal({
      administradorPrincipal: false,
      id: "admin-existente",
      status: "ativo",
      versaoAutorizacao: 4,
    }),
    {
      administradorId: "admin-existente",
      tipo: "promover",
      versaoFinal: 5,
    },
  );
});

test("vínculo desativado nunca é reativado silenciosamente", () => {
  assert.deepEqual(
    decidirBootstrapPrincipal({
      administradorPrincipal: false,
      id: "admin-desativado",
      status: "desativado",
      versaoAutorizacao: 9,
    }),
    {
      administradorId: "admin-desativado",
      tipo: "recusar_desativado",
    },
  );
});
