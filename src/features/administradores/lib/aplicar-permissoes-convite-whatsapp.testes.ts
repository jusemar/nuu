import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fonte = readFileSync("src/features/administradores/lib/aplicar-permissoes-convite-whatsapp.ts", "utf8");

test("RBAC usa somente permissões do convite validado sem consumir recursos", () => {
  assert.match(fonte, /validarAceiteConviteWhatsappNaTransacao\(tx, entrada\)/);
  assert.match(fonte, /convitesPermissoesTable\.conviteId, entrada\.validacao\.conviteId/);
  assert.match(fonte, /administradoresPermissoesTable/);
  assert.match(fonte, /onConflictDoNothing/);
  assert.match(fonte, /\.transaction\(/);
  assert.doesNotMatch(fonte, /convitesAdministrativosTable/);
  assert.doesNotMatch(fonte, /provasPosseConvitesAdministrativosTable/);
});
