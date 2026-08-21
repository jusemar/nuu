import assert from "node:assert/strict";
import test from "node:test";

import { resolverPoliticaIdentificacaoMerchant } from "./resolver-politica-identificacao-merchant";

test("omite condition sem fonte e não afirma ausência de identificadores", () => {
  const politica = resolverPoliticaIdentificacaoMerchant();
  assert.equal(politica.condition, undefined);
  assert.equal(politica.identifierExists, undefined);
});
