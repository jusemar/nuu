import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  apresentarEmailCliente,
  formatarTelefoneAutenticacaoCliente,
  identificarMetodosAcesso,
} from "./apresentar-identidade-cliente";
import { normalizarTelefoneBrasileiroAmigavel } from "./normalizar-identificador-cliente";

const fonteComponente = readFileSync(
  "src/features/autenticacao/components/store/minha-conta/acesso-seguranca-cliente.tsx",
  "utf8",
);
const fonteGestaoEmail = readFileSync(
  "src/features/autenticacao/components/store/minha-conta/gestao-email-cliente.tsx",
  "utf8",
);
const fontePlugin = readFileSync(
  "src/features/autenticacao/lib/plugin-fluxos-telefone-nuu.ts",
  "utf8",
);
const fonteConsulta = readFileSync(
  "src/features/autenticacao/queries/acesso-seguranca/buscar-acesso-seguranca-cliente.ts",
  "utf8",
);

test("exibe conta com e-mail real e preserva seu estado de verificação", () => {
  assert.equal(
    apresentarEmailCliente("cliente@exemplo.com"),
    "cliente@exemplo.com",
  );
  assert.match(fonteConsulta, /emailVerificado: usuario\.emailVerified/);
});

test("conta com e-mail técnico nunca expõe o endereço", () => {
  assert.equal(apresentarEmailCliente("conta-hash@telefone.nuu.invalid"), null);
  assert.match(fonteGestaoEmail, /E-mail não adicionado/);
  assert.doesNotMatch(fonteGestaoEmail, /telefone\.nuu\.invalid/);
});

test("telefone verificado e não verificado refletem user como fonte", () => {
  assert.match(fonteConsulta, /telefone: usuario\.phoneNumber/);
  assert.match(
    fonteConsulta,
    /telefoneVerificado: usuario\.phoneNumberVerified/,
  );
  assert.match(fonteComponente, /WhatsApp verificado/);
  assert.match(fonteComponente, /WhatsApp não verificado/);
});

test("formata o WhatsApp canônico para o próprio usuário", () => {
  assert.equal(
    formatarTelefoneAutenticacaoCliente("+5531999999999"),
    "(31) 99999-9999",
  );
  assert.equal(formatarTelefoneAutenticacaoCliente(null), null);
});

test("aceita número brasileiro válido e rejeita inválido", () => {
  assert.equal(
    normalizarTelefoneBrasileiroAmigavel("(31) 99999-9999"),
    "+5531999999999",
  );
  assert.equal(normalizarTelefoneBrasileiroAmigavel("31 8888-9999"), null);
});

test("alteração solicita e confirma OTP exclusivamente no backend seguro", () => {
  assert.match(fonteComponente, /\/telefone\/vinculo\/solicitar/);
  assert.match(fonteComponente, /\/telefone\/vinculo\/confirmar/);
  assert.match(fontePlugin, /finalidade: "alteracao_numero"/);
});

test("OTP correto altera phone_number e marca como verificado", () => {
  assert.match(fontePlugin, /phoneNumber,/);
  assert.match(fontePlugin, /phoneNumberVerified: true/);
  assert.match(fonteComponente, /WhatsApp alterado e verificado com sucesso/);
});

test("OTP incorreto ou expirado não altera a identidade", () => {
  assert.match(fontePlugin, /if \(resultado !== "VALIDO"\)/);
  assert.match(fontePlugin, /throw new APIError\("BAD_REQUEST"/);
});

test("reenvio possui cooldown de sessenta segundos", () => {
  assert.match(fonteComponente, /setSegundosReenvio\(60\)/);
  assert.match(fonteComponente, /Reenviar código/);
  assert.match(fonteComponente, /segundosReenvio > 0/);
});

test("conflito com outro usuário é bloqueado sem transferir o número", () => {
  assert.match(fontePlugin, /ne\(userTable\.id, sessao\.user\.id\)/);
  assert.match(fontePlugin, /if \(!conflito\)/);
  assert.match(fonteComponente, /Não foi possível usar este número/);
});

test("sessão não recente exige reautenticação", () => {
  assert.match(fontePlugin, /15 \* 60 \* 1_000/);
  assert.match(fontePlugin, /REAUTENTICACAO_NECESSARIA/);
  assert.match(fonteComponente, /Confirme sua identidade/);
});

test("reautenticação por senha valida a credential sem receber identificador", () => {
  assert.match(fontePlugin, /\/telefone\/vinculo\/reautenticar-senha/);
  assert.match(fontePlugin, /providerId, "credential"/);
  assert.match(fontePlugin, /password\.verify/);
  assert.doesNotMatch(
    fontePlugin,
    /reautenticar-senha[\s\S]{0,900}phoneNumber/,
  );
});

test("alteração concluída revoga outras sessões e mantém a atual", () => {
  assert.match(fontePlugin, /eq\(sessionTable\.userId, sessao\.user\.id\)/);
  assert.match(fontePlugin, /ne\(sessionTable\.id, sessao\.session\.id\)/);
});

test("conta somente Google usa reautenticação Google sem criar senha", () => {
  assert.deepEqual(identificarMetodosAcesso(["google"]), {
    possuiSenha: false,
    possuiGoogle: true,
  });
  assert.match(fonteComponente, /provider: "google"/);
  assert.doesNotMatch(fonteComponente, /signUp|createAccount/);
});

test("conta WhatsApp com credential usa senha e mantém e-mail oculto", () => {
  assert.deepEqual(identificarMetodosAcesso(["credential"]), {
    possuiSenha: true,
    possuiGoogle: false,
  });
  assert.equal(apresentarEmailCliente("conta-hash@telefone.nuu.invalid"), null);
});

test("conta Google com credential oferece os dois métodos válidos", () => {
  assert.deepEqual(identificarMetodosAcesso(["google", "credential"]), {
    possuiSenha: true,
    possuiGoogle: true,
  });
});

test("troca atualiza o usuário existente e nunca cria outra conta", () => {
  assert.match(fontePlugin, /update\(userTable\)/);
  assert.doesNotMatch(fontePlugin, /vinculo[\s\S]{0,2600}insert\(userTable\)/);
});

test("perfil, checkout e pedidos históricos não participam da alteração", () => {
  assert.doesNotMatch(fontePlugin, /perfisClientes|checkoutClientes|pedido/);
  assert.doesNotMatch(fonteConsulta, /perfisClientes|checkoutClientes|pedido/);
});

test("user.whatsapp permanece fora da identidade canônica do cliente", () => {
  assert.doesNotMatch(fonteConsulta, /\.whatsapp/);
  assert.doesNotMatch(fonteComponente, /\.whatsapp/);
});

test("UX mascara novo telefone, limita OTP e anuncia estados", () => {
  assert.match(fonteComponente, /mascararTelefoneCliente\(telefoneCanonico\)/);
  assert.match(fonteComponente, /maxLength=\{6\}/);
  assert.match(fonteComponente, /aria-live="polite"/);
  assert.match(fonteComponente, /disabled=\{processando\}/);
});

test("auditoria não registra telefone, OTP, senha ou segredo", () => {
  assert.match(fontePlugin, /whatsapp-alterado/);
  assert.match(fontePlugin, /usuarioId: sessao\.user\.id/);
  assert.doesNotMatch(
    fontePlugin,
    /console\.info\("\[autenticacao:cliente:whatsapp-alterado\]",\s*\{[^}]*(phoneNumber|codigo|password|segredo)/,
  );
});

test("nenhuma chamada direta à Meta existe na gestão da conta", () => {
  assert.doesNotMatch(fonteComponente, /graph\.facebook|ACCESS_TOKEN/);
  assert.doesNotMatch(fontePlugin, /graph\.facebook|ACCESS_TOKEN/);
});
