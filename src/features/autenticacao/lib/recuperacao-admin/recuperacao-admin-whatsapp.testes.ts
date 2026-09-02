import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { normalizarPhoneNumberAdmin } from "../normalizar-whatsapp-admin";
import { telefoneAdminVerificadoParaLogin } from "../validar-telefone-login-admin";
import { candidatoElegivelRecuperacaoAdmin } from "./elegibilidade-recuperacao-admin";

const fontePlugin = readFileSync(
  "src/features/autenticacao/lib/plugin-recuperacao-admin-whatsapp.ts",
  "utf8",
);
const fonteLogin = readFileSync(
  "src/features/autenticacao/lib/plugin-login-identificador-admin.ts",
  "utf8",
);
const fonteTela = readFileSync(
  "src/features/autenticacao/components/admin/pagina-solicitar-recuperacao-senha.tsx",
  "utf8",
);

const usuarioNaoVerificado = {
  id: "usuario-admin",
  phoneNumberVerified: false,
};
const usuarioVerificado = {
  id: "usuario-admin",
  phoneNumberVerified: true,
};
const administradorAtivo = { status: "ativo" as const };
const contaCredencial = { id: "credential", password: "hash" };

const adminLegadoElegivel = {
  usuario: usuarioNaoVerificado,
  administrador: administradorAtivo,
  contaCredencial,
  conflitoTelefone: false,
};

test("admin ativo não verificado é elegível sem promoção antecipada", () => {
  assert.equal(
    candidatoElegivelRecuperacaoAdmin(adminLegadoElegivel),
    true,
  );
  assert.equal(usuarioNaoVerificado.phoneNumberVerified, false);
});

test("admin ativo já verificado continua elegível", () => {
  assert.equal(
    candidatoElegivelRecuperacaoAdmin({
      usuario: usuarioVerificado,
      administrador: administradorAtivo,
      contaCredencial,
    }),
    true,
  );
});

test("telefone legado sem conflito é elegível e conflito canônico bloqueia antes do OTP", () => {
  assert.equal(candidatoElegivelRecuperacaoAdmin(adminLegadoElegivel), true);
  assert.equal(
    candidatoElegivelRecuperacaoAdmin({
      ...adminLegadoElegivel,
      conflitoTelefone: true,
    }),
    false,
  );
});

test("usuário comum, admin inativo, telefone inexistente ou sem credential são inelegíveis", () => {
  const entradas = [
    {
      usuario: usuarioNaoVerificado,
      administrador: null,
      contaCredencial,
    },
    {
      usuario: usuarioNaoVerificado,
      administrador: { status: "desativado" as const },
      contaCredencial,
    },
    { usuario: null, administrador: null, contaCredencial: null },
    {
      usuario: usuarioNaoVerificado,
      administrador: administradorAtivo,
      contaCredencial: null,
    },
  ];
  for (const entrada of entradas) {
    assert.equal(candidatoElegivelRecuperacaoAdmin(entrada), false);
  }
});

test("endpoints administrativos usam finalidade exclusiva e resposta neutra", () => {
  assert.match(fontePlugin, /\/admin\/telefone\/recuperacao\/solicitar/);
  assert.match(fontePlugin, /\/admin\/telefone\/recuperacao\/redefinir/);
  assert.match(fontePlugin, /"admin_recuperacao"/);
  assert.match(fontePlugin, /MENSAGEM_NEUTRA/);
  assert.doesNotMatch(fontePlugin, /"recuperacao" as const/);
});

test("OTP válido precede senha, verificação do telefone e revogação de sessões", () => {
  const indiceValido = fontePlugin.indexOf('resultado !== "VALIDO"');
  const indiceSenha = fontePlugin.indexOf("password: senhaHash");
  const indiceVerificado = fontePlugin.indexOf("phoneNumberVerified: true");
  const indiceSessoes = fontePlugin.indexOf("delete(sessionTable)");
  assert.ok(indiceValido >= 0);
  assert.ok(indiceSenha > indiceValido);
  assert.ok(indiceVerificado > indiceSenha);
  assert.ok(indiceSessoes > indiceVerificado);
  assert.match(fontePlugin, /administradoresTable\.status, "ativo"/);
  assert.match(fontePlugin, /dbTransacional\.transaction/);
  assert.match(fontePlugin, /phoneNumber,\n\s*phoneNumberVerified: true/);
  assert.match(fontePlugin, /eq\(userTable\.whatsapp, phoneNumber\.slice\(1\)\)/);
});

test("recuperação administra transição legada sem abrir fallback no login", () => {
  assert.match(fontePlugin, /eq\(userTable\.whatsapp, phoneNumber\.slice\(1\)\)/);
  assert.match(fontePlugin, /isNull\(userTable\.phoneNumber\)/);
  assert.match(fontePlugin, /ne\(userTable\.id, usuario\.id\)/);
  assert.match(fontePlugin, /CONFLITO_TELEFONE/);
  assert.match(fontePlugin, /OTP_EMITIDO/);
  assert.match(fontePlugin, /FALHA_ENVIO/);
  assert.doesNotMatch(fonteLogin, /userTable\.whatsapp/);
});

test("login admin usa phone_number canônico verificado e preserva e-mail", () => {
  assert.equal(normalizarPhoneNumberAdmin("(31) 99999-9999"), "+5531999999999");
  assert.match(fonteLogin, /userTable\.email/);
  assert.match(fonteLogin, /userTable\.phoneNumber/);
  assert.match(fonteLogin, /telefoneAdminVerificadoParaLogin\(usuario\)/);
  assert.doesNotMatch(fonteLogin, /userTable\.whatsapp/);
  assert.equal(
    telefoneAdminVerificadoParaLogin({ phoneNumberVerified: true }),
    true,
  );
  assert.equal(
    telefoneAdminVerificadoParaLogin({ phoneNumberVerified: false }),
    false,
  );
});

test("interface mantém e-mail e adiciona WhatsApp, OTP, senha e sucesso", () => {
  assert.match(fonteTela, /requestPasswordReset/);
  assert.match(fonteTela, /\/admin\/telefone\/recuperacao\/solicitar/);
  assert.match(fonteTela, /\/admin\/telefone\/recuperacao\/redefinir/);
  assert.match(fonteTela, /Código de 6 dígitos/);
  assert.match(fonteTela, /Confirmar nova senha/);
  assert.match(fonteTela, /Voltar ao login/);
});

test("observabilidade administrativa não registra credenciais ou telefone", () => {
  assert.match(fontePlugin, /identificadorSanitizado/);
  assert.match(fontePlugin, /NAO_ELEGIVEL/);
  assert.match(fontePlugin, /WHATSAPP_LEGADO/);
  assert.match(fontePlugin, /PHONE_NUMBER/);
  assert.match(fontePlugin, /OTP_CONFIRMADO/);
  assert.match(fontePlugin, /REDEFINICAO_CONCLUIDA/);
  const chamadasLog = fontePlugin.match(/console\.info\([\s\S]*?\);/g) ?? [];
  assert.ok(chamadasLog.length > 0);
  for (const chamada of chamadasLog) {
    assert.doesNotMatch(chamada, /phoneNumber|code|newPassword|token|cookie/);
  }
});
