import assert from "node:assert/strict";
import { it } from "node:test";

import { autorizarJobLaquila } from "./autorizar-job-laquila";

it("recusa segredo ausente, header ausente, público e credenciais incorretas", () => {
  assert.equal(autorizarJobLaquila("Bearer configurado", undefined), false);
  assert.equal(autorizarJobLaquila(null, "configurado"), false);
  assert.equal(autorizarJobLaquila("configurado", "configurado"), false);
  assert.equal(autorizarJobLaquila("Bearer outro", "configurado"), false);
  assert.equal(autorizarJobLaquila("Bearer ", "configurado"), false);
});

it("aceita somente o segredo exato e não falha por tamanhos UTF-8 diferentes", () => {
  assert.equal(
    autorizarJobLaquila("Bearer segredo-exato", "segredo-exato"),
    true,
  );
  assert.equal(autorizarJobLaquila("Bearer á", "a"), false);
});
