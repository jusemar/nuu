import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fonte = readFileSync("src/features/administradores/lib/criar-vinculo-convite-whatsapp.ts", "utf8");

test("vínculo usa apenas validação interna e não consome recursos", () => {
  assert.match(fonte, /validarAceiteConviteWhatsappNaTransacao\(tx, entrada\)/);
  assert.match(fonte, /criarOuReutilizarVinculoConviteWhatsappNaTransacao/);
  assert.match(fonte, /usuarioId: validacao\.usuarioId/);
  assert.match(fonte, /\.transaction\(/);
  assert.match(fonte, /existente\.status !== "ativo"/);
  assert.doesNotMatch(fonte, /convitesAdministrativosTable/);
  assert.doesNotMatch(fonte, /provasPosseConvitesAdministrativosTable/);
  assert.doesNotMatch(fonte, /permissoes/);
});
