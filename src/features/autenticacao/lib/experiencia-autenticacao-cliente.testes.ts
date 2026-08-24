import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  criarDestinoPosAutenticacao,
  normalizarDestinoAutenticacao,
} from "./destino-autenticacao-cliente";
import {
  criarEmailTecnicoTelefone,
  emailEhTecnicoTelefone,
} from "./email-tecnico-telefone";
import { mapearSessaoCliente } from "./mapear-sessao-cliente";
import {
  mascararTelefoneCliente,
  normalizarIdentificadorCliente,
  normalizarTelefoneBrasileiroAmigavel,
} from "./normalizar-identificador-cliente";

const fonteFluxo = readFileSync(
  "src/features/autenticacao/components/store/autenticacao/fluxo-autenticacao-cliente.tsx",
  "utf8",
);
const fontePlugin = readFileSync(
  "src/features/autenticacao/lib/plugin-fluxos-telefone-nuu.ts",
  "utf8",
);

test("detecta e normaliza e-mail no identificador único", () => {
  assert.deepEqual(normalizarIdentificadorCliente(" Pessoa@Exemplo.com "), {
    tipo: "email",
    valor: "pessoa@exemplo.com",
  });
});

test("aceita WhatsApp brasileiro amigável e converte para E.164", () => {
  assert.equal(
    normalizarTelefoneBrasileiroAmigavel("(31) 99999-9999"),
    "+5531999999999",
  );
  assert.deepEqual(normalizarIdentificadorCliente("31 99999-9999"), {
    tipo: "telefone",
    valor: "+5531999999999",
  });
});

test("recusa identificador e telefone inválidos", () => {
  assert.equal(normalizarIdentificadorCliente("qualquer coisa"), null);
  assert.equal(normalizarTelefoneBrasileiroAmigavel("31 8888-9999"), null);
});

test("mascara telefone sem expor o número completo", () => {
  const mascarado = mascararTelefoneCliente("+5531999999999");
  assert.equal(mascarado, "••••••9999");
  assert.doesNotMatch(mascarado, /5531999999999/);
});

test("aceita destino interno e preserva query", () => {
  assert.equal(
    normalizarDestinoAutenticacao("/checkout?etapa=entrega"),
    "/checkout?etapa=entrega",
  );
});

test("recusa open redirect absoluto ou protocol-relative", () => {
  assert.equal(
    normalizarDestinoAutenticacao("https://malicioso.test"),
    "/minha-conta",
  );
  assert.equal(
    normalizarDestinoAutenticacao("//malicioso.test"),
    "/minha-conta",
  );
});

test("redireciona autenticação pela checagem de cadastro complementar", () => {
  assert.equal(
    criarDestinoPosAutenticacao("/checkout"),
    "/completar-cadastro?destino=%2Fcheckout",
  );
});

test("e-mail técnico é determinístico, não reversível e reservado", () => {
  const primeiro = criarEmailTecnicoTelefone("+5531999999999", "segredo-forte");
  const segundo = criarEmailTecnicoTelefone("+5531999999999", "segredo-forte");
  assert.equal(primeiro, segundo);
  assert.equal(emailEhTecnicoTelefone(primeiro), true);
  assert.doesNotMatch(primeiro, /5531999999999|31999999999/);
  assert.match(primeiro, /@telefone\.nuu\.invalid$/);
});

test("e-mail técnico não é exposto no mapeamento da sessão do cliente", () => {
  const sessao = mapearSessaoCliente({
    user: {
      id: "u1",
      name: "Cliente",
      email: criarEmailTecnicoTelefone("+5531999999999", "segredo"),
      createdAt: new Date(),
    },
    session: {
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  assert.equal(sessao?.usuario.email, "");
});

test("login usa mensagem neutra para qualquer credencial inválida", () => {
  assert.match(fonteFluxo, /E-mail, WhatsApp ou senha inválidos\./);
  assert.doesNotMatch(fonteFluxo, /E-mail não encontrado/);
});

test("login por e-mail, WhatsApp e Google permanecem disponíveis", () => {
  assert.match(fonteFluxo, /signIn\.email/);
  assert.match(fonteFluxo, /\/telefone\/entrar/);
  assert.match(fonteFluxo, /signIn\.social/);
  assert.match(fonteFluxo, /provider: "google"/);
});

test("cadastro por e-mail preserva nome, senha e confirmação", () => {
  assert.match(fonteFluxo, /signUp\.email/);
  assert.match(fonteFluxo, /As senhas não coincidem/);
  assert.match(fonteFluxo, /cadastro-email/);
});

test("cadastro WhatsApp solicita OTP e conclui somente após confirmação", () => {
  assert.match(fonteFluxo, /\/telefone\/cadastro\/solicitar/);
  assert.match(fonteFluxo, /\/telefone\/cadastro\/concluir/);
  assert.match(fontePlugin, /finalidade: "cadastro"/);
  assert.match(fontePlugin, /phoneNumberVerified: true/);
  assert.match(fontePlugin, /dbTransacional\.transaction/);
});

test("cadastro WhatsApp evita duplicidade e cria sessão", () => {
  assert.match(fontePlugin, /eq\(userTable\.phoneNumber, phoneNumber\)/);
  assert.match(fontePlugin, /createSession/);
  assert.match(fontePlugin, /setSessionCookie/);
});

test("UX OTP possui seis dígitos, cooldown e reenvio", () => {
  assert.match(fonteFluxo, /maxLength=\{6\}/);
  assert.match(fonteFluxo, /setSegundosReenvio\(60\)/);
  assert.match(fonteFluxo, /Reenviar código/);
  assert.match(fonteFluxo, /aria-live="polite"/);
});

test("fluxo não registra OTP e não possui integração direta com Meta", () => {
  assert.doesNotMatch(
    fonteFluxo,
    /console\.(log|error)|graph\.facebook|ACCESS_TOKEN/,
  );
  assert.doesNotMatch(fontePlugin, /console\.(log|error)|graph\.facebook/);
});
