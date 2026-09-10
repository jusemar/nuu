import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fonte = readFileSync("src/features/administradores/lib/validar-aceite-convite-whatsapp.ts", "utf8");

test("validação deriva identidade e permissões somente do convite e prova", () => {
  assert.match(fonte, /calcularHashTokenConvite/);
  assert.match(fonte, /tipoIdentificador !== "whatsapp"/);
  assert.match(fonte, /!prova\.confirmadoEm/);
  assert.match(fonte, /contextoHash/);
  assert.match(fonte, /phoneNumberVerified/);
  assert.match(fonte, /convitesPermissoesTable\.conviteId/);
  assert.match(fonte, /prontoParaAceite: true/);
  assert.doesNotMatch(fonte, /administradoresTable/);
  assert.doesNotMatch(fonte, /status: "aceito"/);
});
