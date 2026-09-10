import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fonte = readFileSync(
  "src/features/autenticacao/lib/plugin-convite-admin-whatsapp.ts",
  "utf8",
);
const schema = readFileSync(
  "src/features/autenticacao/schemas/convite-admin-whatsapp.schema.ts",
  "utf8",
);

test("emissão de convite usa somente token e finalidade isolada", () => {
  assert.match(fonte, /\/admin\/convite\/whatsapp\/otp\/solicitar/);
  assert.match(fonte, /solicitarOtpConviteAdminSchema/);
  assert.match(fonte, /const FINALIDADE = "admin_convite"/);
  assert.match(fonte, /convite\.identificadorNormalizado/);
  assert.doesNotMatch(fonte, /contexto\.body\.phoneNumber/);
  assert.match(fonte, /comunicacaoWhatsapp\.enviarOtp/);
});

test("prova é vinculada ao convite e bloqueia sessão incompatível", () => {
  assert.match(fonte, /provasPosseConvitesAdministrativosTable/);
  assert.match(fonte, /contextoHash/);
  assert.match(fonte, /usuario\.id !== sessao\.user\.id/);
  assert.match(fonte, /\.for\("update"\)/);
  assert.match(fonte, /onConflictDoUpdate/);
});

test("confirmação consome somente OTP admin_convite e não aceita convite", () => {
  assert.match(fonte, /\/admin\/convite\/whatsapp\/otp\/confirmar/);
  assert.match(fonte, /confirmarOtpConviteAdminSchema/);
  assert.match(fonte, /finalidade: FINALIDADE/);
  assert.match(fonte, /confirmadoEm: new Date\(\)/);
  assert.match(fonte, /CONFIRMACAO_CONCLUIDA/);
  assert.doesNotMatch(fonte, /status: "aceito"/);
  assert.doesNotMatch(fonte, /insert\(administradoresTable\)/);
});

test("identificação só usa prova confirmada e telefone canônico", () => {
  assert.match(fonte, /\/admin\/convite\/whatsapp\/identificar-usuario/);
  assert.match(fonte, /!prova\.confirmadoEm/);
  assert.match(fonte, /eq\(userTable\.phoneNumber, convite\.identificadorNormalizado\)/);
  assert.match(fonte, /phoneNumberVerified: true/);
  assert.match(fonte, /proximoPasso: "CADASTRO"/);
  assert.doesNotMatch(fonte, /userTable\.whatsapp/);
});

test("cadastro exige prova confirmada e cria somente identidade canônica", () => {
  assert.match(fonte, /\/admin\/convite\/whatsapp\/cadastrar-usuario/);
  assert.match(fonte, /cadastrarUsuarioConviteAdminSchema/);
  assert.match(schema, /name: z\.string\(\)\.trim\(\)\.min\(2\)/);
  assert.match(schema, /email: z\.string\(\)\.trim\(\)\.email\(\)/);
  assert.match(schema, /passwordConfirmation/);
  assert.match(fonte, /!prova\.confirmadoEm/);
  assert.match(fonte, /prova\.usuarioId/);
  assert.match(fonte, /phoneNumber: convite\.identificadorNormalizado/);
  assert.match(fonte, /phoneNumberVerified: true/);
  assert.match(fonte, /providerId: "credential"/);
  assert.match(fonte, /set\(\{ usuarioId \}\)/);
  assert.match(fonte, /\.transaction\(/);
  assert.match(fonte, /if \(porTelefone \|\| porEmail\) return null/);
  assert.doesNotMatch(fonte, /contexto\.body\.phoneNumber/);
  assert.doesNotMatch(fonte, /userTable\.whatsapp/);
  assert.doesNotMatch(fonte, /status: "aceito"/);
  assert.doesNotMatch(fonte, /administradoresTable/);
  assert.doesNotMatch(fonte, /permissoesAdministrativasTable/);
});
