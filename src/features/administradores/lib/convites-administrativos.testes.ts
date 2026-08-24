import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  calcularExpiracaoConvite,
  calcularHashTokenConvite,
  compararHashTokenConvite,
  gerarTokenConviteAdministrativo,
} from "./token-convite-administrativo";

test("token é forte, armazenável somente por hash e não é reutilizado", () => {
  const primeiro = gerarTokenConviteAdministrativo();
  const segundo = gerarTokenConviteAdministrativo();

  assert.ok(primeiro.token.length >= 43);
  assert.equal(primeiro.tokenHash.length, 64);
  assert.notEqual(primeiro.token, segundo.token);
  assert.notEqual(primeiro.tokenHash, segundo.tokenHash);
  assert.equal(primeiro.tokenHash, calcularHashTokenConvite(primeiro.token));
  assert.equal(
    compararHashTokenConvite(primeiro.token, primeiro.tokenHash),
    true,
  );
  assert.equal(
    compararHashTokenConvite(segundo.token, primeiro.tokenHash),
    false,
  );
  assert.notEqual(primeiro.tokenHash, primeiro.token);
});

test("expiração padrão é de 24 horas", () => {
  const inicio = new Date("2026-08-24T12:00:00.000Z");
  assert.equal(
    calcularExpiracaoConvite(inicio).toISOString(),
    "2026-08-25T12:00:00.000Z",
  );
});

test("criação, reenvio, revogação e aceite têm guards e estados explícitos", () => {
  const criar = readFileSync(
    "src/features/administradores/actions/criar-convite-administrador.ts",
    "utf8",
  );
  const gerenciar = readFileSync(
    "src/features/administradores/actions/gerenciar-convite-administrador.ts",
    "utf8",
  );
  const aceitar = readFileSync(
    "src/features/administradores/actions/aceitar-convite-administrador.ts",
    "utf8",
  );

  assert.match(criar, /ADMINISTRADORES\.ADMINISTRAR/);
  assert.match(criar, /validarDelegacaoPermissoes/);
  assert.doesNotMatch(criar, /administradorPrincipal:\s*true/);
  assert.match(gerenciar, /status:\s*"revogado"/);
  assert.match(gerenciar, /tokenHash/);
  assert.match(aceitar, /\.transaction\(/);
  assert.match(aceitar, /\.for\("update"\)/);
  assert.match(aceitar, /status:\s*"aceito"/);
  assert.match(aceitar, /administradorPrincipal:\s*false/);
  assert.match(aceitar, /EMISSOR_SEM_AUTORIDADE/);
  assert.match(aceitar, /delegaveis\.has\("administradores\.administrar"\)/);
  assert.match(aceitar, /FUNCAO_INATIVA|PERMISSAO_INATIVA/);
  assert.match(criar, /versaoAutorizacao !== contexto\.versaoAutorizacao/);
});

test("credencial pertence ao convidado e o emissor não cria usuário", () => {
  const criar = readFileSync(
    "src/features/administradores/actions/criar-convite-administrador.ts",
    "utf8",
  );
  const pagina = readFileSync(
    "src/features/administradores/components/publico/pagina-aceite-convite.tsx",
    "utf8",
  );

  assert.doesNotMatch(criar, /signUp|password|senha/);
  assert.match(pagina, /authClient\.signUp\.email/);
  assert.match(pagina, /authClient\.signIn\.email/);
  assert.match(pagina, /authClient\.signIn\.social/);
});

test("convite global permanece isolado do RBAC local do Atendente IA", () => {
  const arquivos = [
    "src/features/administradores/actions/criar-convite-administrador.ts",
    "src/features/administradores/actions/aceitar-convite-administrador.ts",
    "src/features/administradores/actions/gerenciar-convite-administrador.ts",
  ];
  const fonte = arquivos
    .map((arquivo) => readFileSync(arquivo, "utf8"))
    .join("\n");

  assert.doesNotMatch(
    fonte,
    /atendimento_ia_papeis_admin|gestor_principal|atendimento-ia/,
  );
});
