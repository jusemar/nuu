import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  criarHashTokenConfirmacaoEmail,
  gerarTokenConfirmacaoEmail,
} from "./criptografia-confirmacao-email";
import { POLITICA_CONFIRMACAO_EMAIL } from "./politica-confirmacao-email";

const fonteServico = readFileSync(
  "src/features/autenticacao/lib/confirmacao-email/servico-confirmacao-email.ts",
  "utf8",
);
const fontePlugin = readFileSync(
  "src/features/autenticacao/lib/plugin-confirmacao-email-cliente.ts",
  "utf8",
);
const fonteGestao = readFileSync(
  "src/features/autenticacao/components/store/minha-conta/gestao-email-cliente.tsx",
  "utf8",
);
const fonteConfirmacao = readFileSync(
  "src/features/autenticacao/components/store/minha-conta/confirmacao-email-cliente.tsx",
  "utf8",
);
const fonteConsulta = readFileSync(
  "src/features/autenticacao/queries/acesso-seguranca/buscar-acesso-seguranca-cliente.ts",
  "utf8",
);
const fonteEmail = readFileSync(
  "src/features/autenticacao/lib/emails/enviar-email-confirmacao-cliente.ts",
  "utf8",
);

test("token possui 256 bits aleatórios e armazenamento não recuperável", () => {
  const primeiro = gerarTokenConfirmacaoEmail();
  const segundo = gerarTokenConfirmacaoEmail();
  assert.notEqual(primeiro, segundo);
  assert.ok(primeiro.length >= 43);
  assert.match(criarHashTokenConfirmacaoEmail(primeiro), /^[a-f0-9]{64}$/);
  assert.doesNotMatch(
    criarHashTokenConfirmacaoEmail(primeiro),
    new RegExp(primeiro),
  );
});

test("desafio expira em trinta minutos", () => {
  assert.equal(POLITICA_CONFIRMACAO_EMAIL.validadeMinutos, 30);
  assert.match(fonteServico, /validadeMinutos \* 60_000/);
});

test("e-mail técnico permanece oculto e pode iniciar adição de e-mail", () => {
  assert.match(fonteGestao, /E-mail não adicionado/);
  assert.match(fonteGestao, /Adicionar e-mail/);
  assert.doesNotMatch(fonteGestao, /telefone\.nuu\.invalid/);
  assert.match(fonteConsulta, /apresentarEmailCliente/);
});

test("conta com e-mail real oferece alteração e mantém estado verificado", () => {
  assert.match(fonteGestao, /Alterar e-mail/);
  assert.match(fonteGestao, /E-mail verificado/);
  assert.match(fonteGestao, /E-mail não verificado/);
});

test("solicitação não altera user.email antes da confirmação", () => {
  const trechoSolicitacao = fontePlugin.slice(
    0,
    fontePlugin.indexOf("confirmarEmailCliente:"),
  );
  assert.doesNotMatch(
    trechoSolicitacao,
    /update\(userTable\)|emailVerified: true/,
  );
  assert.match(fonteGestao, /e-mail atual permanece válido até a confirmação/i);
});

test("novo envio invalida o desafio anterior e respeita cooldown", () => {
  assert.match(
    fonteServico,
    /Somente o desafio mais recente pode continuar ativo/,
  );
  assert.match(
    fonteServico,
    /isNull\(desafiosConfirmacaoEmailTable\.consumidoEm\)/,
  );
  assert.equal(POLITICA_CONFIRMACAO_EMAIL.reenvioSegundos, 60);
  assert.match(fonteGestao, /Reenviar em/);
});

test("solicitação e reenvio possuem limite persistente por usuário", () => {
  assert.equal(POLITICA_CONFIRMACAO_EMAIL.maximoSolicitacoesHora, 5);
  assert.match(fonteServico, /count\(\)/);
  assert.match(fonteServico, /desafiosConfirmacaoEmailTable\.createdAt/);
  assert.equal(POLITICA_CONFIRMACAO_EMAIL.maximoSolicitacoesHoraEmail, 5);
  assert.equal(POLITICA_CONFIRMACAO_EMAIL.maximoSolicitacoesHoraIp, 10);
});

test("confirmação possui limite persistente por IP", () => {
  assert.equal(POLITICA_CONFIRMACAO_EMAIL.maximoConfirmacoesHoraIp, 10);
  assert.match(fonteServico, /tentativasConfirmacaoEmailTable/);
  assert.match(fonteServico, /ipHash/);
});

test("token inválido, expirado e reutilizado são diferenciados sem erro bruto", () => {
  assert.match(fonteServico, /"INVALIDO"/);
  assert.match(fonteServico, /"EXPIRADO"/);
  assert.match(fonteServico, /"REUTILIZADO"/);
  assert.match(fonteConfirmacao, /Este link expirou/);
  assert.match(fonteConfirmacao, /Este link já foi utilizado/);
});

test("confirmação válida troca o canônico e marca e-mail verificado", () => {
  assert.match(fonteServico, /email: desafio\.novoEmail/);
  assert.match(fonteServico, /emailVerified: true/);
  assert.match(fonteConfirmacao, /Novo e-mail confirmado com sucesso/);
});

test("desafio é de uso único e todos os pendentes são invalidados", () => {
  assert.match(
    fonteServico,
    /if \(desafio\.consumidoEm\) return "REUTILIZADO"/,
  );
  assert.match(fonteServico, /consumidoEm: agora/);
  assert.match(
    fonteServico,
    /eq\(desafiosConfirmacaoEmailTable\.userId, usuarioId\)/,
  );
});

test("conflito com outro usuário não transfere ou faz merge", () => {
  assert.match(fontePlugin, /EMAIL_INDISPONIVEL/);
  assert.match(fonteServico, /ne\(userTable\.id, usuarioId\)/);
  assert.doesNotMatch(fonteServico, /merge|insert\(userTable\)/i);
});

test("sessão ausente e sessão antiga são bloqueadas", () => {
  assert.match(
    fontePlugin,
    /if \(!sessao\) throw new APIError\("UNAUTHORIZED"\)/,
  );
  assert.match(fontePlugin, /REAUTENTICACAO_NECESSARIA/);
  assert.match(fontePlugin, /15 \* 60 \* 1_000/);
});

test("reautenticação respeita senha, Google e WhatsApp verificado", () => {
  assert.match(fonteGestao, /Confirmar com senha/);
  assert.match(fonteGestao, /Confirmar com Google/);
  assert.match(fonteGestao, /Confirmar com WhatsApp/);
  assert.match(fonteConfirmacao, /provider: "google"/);
});

test("Google, WhatsApp e credential não são alterados pela confirmação", () => {
  assert.doesNotMatch(
    fonteServico,
    /update\(accountTable\)|providerId|accountId/,
  );
  assert.doesNotMatch(fonteServico, /phoneNumber|phoneNumberVerified|whatsapp/);
  assert.doesNotMatch(fonteServico, /password/);
});

test("confirmação atualiza o usuário existente sem criar nova conta", () => {
  assert.match(fonteServico, /update\(userTable\)/);
  assert.doesNotMatch(
    fonteServico,
    /insert\(userTable\)|createAccount|createUser/,
  );
});

test("outras sessões são revogadas e a sessão atual permanece", () => {
  assert.match(fonteServico, /delete\(sessionTable\)/);
  assert.match(fonteServico, /ne\(sessionTable\.id, sessaoId\)/);
});

test("recuperação passa a usar o novo e-mail canônico automaticamente", () => {
  assert.match(fonteServico, /update\(userTable\)/);
  assert.match(fonteServico, /email: desafio\.novoEmail/);
  assert.doesNotMatch(fonteServico, /verificationTable|reset-password/);
});

test("template de confirmação é exclusivo e informa preservação do endereço atual", () => {
  assert.match(fonteEmail, /Confirme seu novo e-mail/);
  assert.match(fonteEmail, /endereço atual continuará válido/);
  assert.doesNotMatch(fonteEmail, /painel administrativo|Redefinição de senha/);
});

test("logs técnicos não incluem token, senha ou e-mail completo", () => {
  assert.doesNotMatch(
    fonteServico,
    /console\.(?:info|error)\([^;]*(?:token,|novoEmail,|senha)/,
  );
  assert.match(fonteServico, /emailHash: novoEmailHash/);
  assert.match(fonteEmail, /token=\)\[\^&\\s\]\+/);
});

test("testes não acionam Resend ou transporte externo", () => {
  const fonteTeste = readFileSync(
    "src/features/autenticacao/lib/confirmacao-email/confirmacao-email-cliente.testes.ts",
    "utf8",
  );
  assert.doesNotMatch(fonteTeste, /obterResend\(|emails\.send\(/);
});
