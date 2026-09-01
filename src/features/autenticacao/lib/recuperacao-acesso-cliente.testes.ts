import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  classificarRecuperacaoEmail,
  normalizarOrigemAutenticacao,
} from "./classificar-recuperacao-email";
import { emailEhTecnicoTelefone } from "./email-tecnico-telefone-compartilhado";
import { normalizarIdentificadorCliente } from "./normalizar-identificador-cliente";
import { usuarioElegivelRecuperacaoTelefone } from "./telefone/usuario-elegivel-recuperacao-telefone";

const fonteFluxo = readFileSync(
  "src/features/autenticacao/components/store/recuperacao/pagina-recuperacao-acesso.tsx",
  "utf8",
);
const fonteResetEmail = readFileSync(
  "src/features/autenticacao/components/store/recuperacao/pagina-redefinir-senha-cliente.tsx",
  "utf8",
);
const fonteAuth = readFileSync("src/lib/auth.ts", "utf8");
const fontePlugin = readFileSync(
  "src/features/autenticacao/lib/plugin-fluxos-telefone-nuu.ts",
  "utf8",
);
const origem = "https://www.nuu.test";

function urlReset(callback: string) {
  return `${origem}/api/auth/reset-password/token-secreto?callbackURL=${encodeURIComponent(callback)}`;
}

test("entrada detecta e-mail válido", () => {
  assert.deepEqual(normalizarIdentificadorCliente("cliente@exemplo.com"), {
    tipo: "email",
    valor: "cliente@exemplo.com",
  });
});

test("entrada detecta WhatsApp amigável e normaliza para E.164", () => {
  assert.deepEqual(normalizarIdentificadorCliente("(31) 99999-9999"), {
    tipo: "telefone",
    valor: "+5531999999999",
  });
});

test("entrada rejeita identificador inválido", () => {
  assert.equal(normalizarIdentificadorCliente("identificador inválido"), null);
});

test("solicitação WhatsApp é neutra e usa backend seguro", () => {
  assert.match(fonteFluxo, /Se encontrarmos uma conta compatível/);
  assert.match(fonteFluxo, /\/telefone\/recuperacao\/solicitar/);
  assert.match(fontePlugin, /mensagemNeutra/);
  assert.match(fontePlugin, /buscarUsuarioPorTelefone\(phoneNumber\)/);
  assert.doesNotMatch(
    fonteFluxo,
    /Código enviado para \{mascararTelefoneCliente\(telefone\)\}/,
  );
});

test("recuperação emite para telefone existente verificado ou legado, nunca para inexistente", () => {
  assert.equal(
    usuarioElegivelRecuperacaoTelefone({ phoneNumberVerified: false }),
    true,
  );
  assert.equal(
    usuarioElegivelRecuperacaoTelefone({ phoneNumberVerified: true }),
    true,
  );
  assert.equal(usuarioElegivelRecuperacaoTelefone(null), false);
});

test("redefinição WhatsApp exige OTP de seis dígitos e nova senha", () => {
  assert.match(fonteFluxo, /\^\[0-9\]\{6\}\$/);
  assert.match(fonteFluxo, /\/telefone\/recuperacao\/redefinir/);
  assert.match(fonteFluxo, /newPassword: novaSenha/);
});

test("OTP incorreto, expirado, reutilizado e bloqueado falham no backend", () => {
  assert.match(fontePlugin, /resultado === "VALIDO"/);
  assert.match(fontePlugin, /throw new APIError\("BAD_REQUEST"/);
  assert.match(fontePlugin, /repositorioOtpTelefoneDrizzle\.invalidar/);
});

test("UX WhatsApp mascara telefone, oferece cooldown e reenvio", () => {
  assert.match(fonteFluxo, /mascararTelefoneCliente/);
  assert.match(fonteFluxo, /setSegundosReenvio\(60\)/);
  assert.match(fonteFluxo, /Reenviar código/);
  assert.doesNotMatch(fonteFluxo, /\{telefone\}<\/p>/);
});

test("reset WhatsApp revoga sessões e não cria login automático", () => {
  assert.match(fontePlugin, /deleteSessions\(usuario\.id\)/);
  assert.doesNotMatch(fontePlugin, /recuperacao[\s\S]{0,900}createSession/);
  assert.match(fonteFluxo, /\/authentication\?recuperacao=concluida/);
});

test("telefone legado só é verificado após OTP de recuperação válido e troca de senha", () => {
  const inicioReset = fontePlugin.indexOf("redefinirSenhaTelefoneNuu");
  const trechoReset = fontePlugin.slice(inicioReset);
  const indiceOtpValido = trechoReset.indexOf('resultado === "VALIDO"');
  const indiceAtualizarSenha = trechoReset.indexOf("updatePassword(");
  const indiceVerificarTelefone = trechoReset.indexOf(
    "phoneNumberVerified: true",
  );

  assert.ok(indiceOtpValido >= 0);
  assert.ok(indiceAtualizarSenha > indiceOtpValido);
  assert.ok(indiceVerificarTelefone > indiceAtualizarSenha);
  assert.match(trechoReset, /finalidade: "recuperacao"/);
  assert.match(trechoReset, /buscarUsuarioPorTelefone\(phoneNumber\)/);
});

test("recuperação de cliente real usa template exclusivo do cliente", () => {
  assert.equal(
    classificarRecuperacaoEmail({
      urlRedefinicao: urlReset(`${origem}/authentication/recuperar/redefinir`),
      origemPermitida: origem,
      administrador: false,
      emailTecnico: false,
    }),
    "cliente",
  );
  assert.match(fonteAuth, /enviarEmailRedefinicaoSenhaCliente/);
});

test("origem oficial é normalizada e callback administrativo relativo é aceito", () => {
  assert.equal(
    normalizarOrigemAutenticacao(" https://nooo.com.br/ "),
    "https://nooo.com.br",
  );
  assert.equal(
    classificarRecuperacaoEmail({
      urlRedefinicao: urlReset("/admin/redefinir-senha"),
      origemPermitida: "https://nooo.com.br/",
      administrador: true,
      emailTecnico: false,
    }),
    "admin",
  );
});

test("conta inexistente mantém resposta neutra no cliente", () => {
  assert.match(fonteFluxo, /email-enviado/);
  assert.match(
    fonteFluxo,
    /if \(normalizado\.tipo === "email"\) setEtapa\("email-enviado"\)/,
  );
  assert.doesNotMatch(fonteFluxo, /e-mail não encontrado|conta inexistente/i);
});

test("e-mail técnico nunca é elegível para recuperação por e-mail", () => {
  assert.equal(emailEhTecnicoTelefone("conta-hash@telefone.nuu.invalid"), true);
  assert.equal(
    classificarRecuperacaoEmail({
      urlRedefinicao: urlReset(`${origem}/authentication/recuperar/redefinir`),
      origemPermitida: origem,
      administrador: false,
      emailTecnico: true,
    }),
    null,
  );
});

test("token de e-mail válido redefine senha e retorna ao login", () => {
  assert.match(fonteResetEmail, /authClient\.resetPassword/);
  assert.match(fonteResetEmail, /\/authentication\?recuperacao=concluida/);
});

test("token inválido, expirado ou reutilizado apresenta erro amigável", () => {
  assert.match(fonteResetEmail, /inválido, expirou ou já foi utilizado/);
  assert.doesNotMatch(fonteResetEmail, /console\.(log|error)/);
});

test("reset por e-mail expira, é de uso único e revoga sessões", () => {
  assert.match(fonteAuth, /resetPasswordTokenExpiresIn: 30 \* 60/);
  assert.match(fonteAuth, /revokeSessionsOnPasswordReset: true/);
});

test("cliente e admin permanecem estritamente separados", () => {
  const urlCliente = urlReset(`${origem}/authentication/recuperar/redefinir`);
  const urlAdmin = urlReset(`${origem}/admin/redefinir-senha`);
  assert.equal(
    classificarRecuperacaoEmail({
      urlRedefinicao: urlCliente,
      origemPermitida: origem,
      administrador: true,
      emailTecnico: false,
    }),
    null,
  );
  assert.equal(
    classificarRecuperacaoEmail({
      urlRedefinicao: urlAdmin,
      origemPermitida: origem,
      administrador: true,
      emailTecnico: false,
    }),
    "admin",
  );
  assert.equal(
    classificarRecuperacaoEmail({
      urlRedefinicao: urlAdmin,
      origemPermitida: origem,
      administrador: false,
      emailTecnico: false,
    }),
    null,
  );
});

test("callback externo ou desconhecido nunca recebe e-mail", () => {
  assert.equal(
    classificarRecuperacaoEmail({
      urlRedefinicao: urlReset("https://malicioso.test/redefinir"),
      origemPermitida: origem,
      administrador: false,
      emailTecnico: false,
    }),
    null,
  );
});

test("fluxos não registram OTP, token, telefone ou senha", () => {
  assert.doesNotMatch(fonteFluxo, /console\.(log|error)/);
  assert.doesNotMatch(fonteResetEmail, /console\.(log|error)/);
  assert.doesNotMatch(fontePlugin, /console\.(log|error)/);
});

test("testes não acionam WhatsApp ou e-mail externos", () => {
  assert.doesNotMatch(fonteFluxo, /graph\.facebook|resend\.emails/);
  assert.doesNotMatch(fonteResetEmail, /graph\.facebook|resend\.emails/);
});
