import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validarDestinoBancoDesenvolvimento } from "../../src/db/destino-banco-desenvolvimento";
import {
  descreverUrlSemSegredo,
  POSTGRES_LOCAL,
  validarUrlPostgresLocal,
} from "./postgres-local";

const URL_LOCAL = `postgresql://nooo:segredo-teste@127.0.0.1:${POSTGRES_LOCAL.porta}/${POSTGRES_LOCAL.banco}`;
const URL_NEON =
  "postgresql://usuario:segredo@ep-exemplo-123456.sa-east-1.aws.neon.tech/neondb";

test("URL local aceita somente o container persistente da Nooo", () => {
  assert.doesNotThrow(() => validarUrlPostgresLocal(URL_LOCAL));
  for (const invalida of [
    URL_NEON,
    URL_LOCAL.replace(String(POSTGRES_LOCAL.porta), "5432"),
    URL_LOCAL.replace(POSTGRES_LOCAL.banco, "outro_banco"),
    URL_LOCAL.replace("nooo:", "postgres:"),
    URL_LOCAL.replace(":segredo-teste", ""),
    "não é url",
  ]) {
    assert.throws(() => validarUrlPostgresLocal(invalida), invalida);
  }
});

test("log do destino nunca mostra a senha", () => {
  const texto = descreverUrlSemSegredo(URL_LOCAL);
  assert.equal(
    texto,
    `127.0.0.1:${POSTGRES_LOCAL.porta}/${POSTGRES_LOCAL.banco}`,
  );
  assert.equal(texto.includes("segredo"), false);
});

test("next dev recusa Neon sem o sinal explícito do dev:neon", () => {
  assert.throws(() =>
    validarDestinoBancoDesenvolvimento({
      url: URL_NEON,
      ambienteNode: "development",
      neonExplicito: undefined,
    }),
  );
  assert.doesNotThrow(() =>
    validarDestinoBancoDesenvolvimento({
      url: URL_NEON,
      ambienteNode: "development",
      neonExplicito: "sim",
    }),
  );
  assert.doesNotThrow(() =>
    validarDestinoBancoDesenvolvimento({
      url: URL_LOCAL,
      ambienteNode: "development",
      neonExplicito: undefined,
    }),
  );
  // Vercel/produção e scripts não passam por esta trava.
  assert.doesNotThrow(() =>
    validarDestinoBancoDesenvolvimento({
      url: URL_NEON,
      ambienteNode: "production",
      neonExplicito: undefined,
    }),
  );
});

test("comandos: dev é local, Neon só em comandos explícitos", () => {
  const scripts = (
    JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    }
  ).scripts;
  assert.equal(scripts.dev, "tsx scripts/iniciar-dev.ts local");
  assert.equal(scripts["dev:neon"], "tsx scripts/iniciar-dev.ts neon");
  assert.equal(scripts["migrations:local"], "tsx scripts/migrations-local.ts");
  assert.equal(scripts["migrations:validar"].includes("--homologacao"), false);
  assert.equal(
    scripts["migrations:validar-apenas"].includes("--somente-validar"),
    true,
  );
  assert.equal(
    scripts["migrations:producao"].includes("AMBIENTE_BANCO=producao"),
    true,
  );
  // Seeds, importações, manutenção e RBAC do dia a dia usam o banco local.
  for (const [nome, comando] of Object.entries(scripts)) {
    if (/^(seed|import|manutencao|rbac|merchant):/.test(nome)) {
      assert.equal(comando.includes("AMBIENTE_BANCO=local"), true, nome);
    }
  }
});

test("lançador do dev nunca reescreve arquivos .env", () => {
  const lancador = readFileSync("scripts/iniciar-dev.ts", "utf8");
  assert.equal(/writeFile|appendFile|copyFile|rename/.test(lancador), false);
  assert.equal(lancador.includes("NOOO_BANCO_NEON_EXPLICITO"), true);
});
