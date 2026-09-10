import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fonte = readFileSync("src/features/administradores/lib/consumir-convite-whatsapp.ts", "utf8");

test("consumo bloqueia convite e prova na mesma transação", () => {
  assert.match(fonte, /\.transaction\(/);
  assert.match(fonte, /\.for\("update"\)/);
  assert.match(fonte, /status: "aceito"/);
  assert.match(fonte, /aceitoEm: agora/);
  assert.match(fonte, /consumidoEm: agora/);
  assert.match(fonte, /PROVA_NAO_CONSUMIDA/);
  assert.match(fonte, /contextoHash/);
  assert.doesNotMatch(fonte, /administradoresPermissoesTable/);
});
