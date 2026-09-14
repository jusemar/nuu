import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  criarRecorteMigrations,
  montarNomePostgresDescartavel,
  validarIdentidadePostgresLocal,
  validarNomeBanco,
} from "./postgres-docker-descartavel";

test("nome do container é único e usa o prefixo informado", () => {
  const primeiro = montarNomePostgresDescartavel("nuu-validacao-migrations");
  const segundo = montarNomePostgresDescartavel("nuu-validacao-migrations");
  assert.match(primeiro, /^nuu-validacao-migrations-\d{14}-[0-9a-f]{8}$/);
  assert.notEqual(primeiro, segundo);
  assert.throws(() => montarNomePostgresDescartavel("Prefixo Inválido"));
});

test("identidade só é aceita em loopback, no cluster e banco desta execução", () => {
  const esperado = { banco: "validacao_vazia", clusterName: "nuu-x-1" };
  assert.doesNotThrow(() =>
    validarIdentidadePostgresLocal(
      { host: "127.0.0.1", banco: "validacao_vazia", clusterName: "nuu-x-1" },
      esperado,
    ),
  );
  // Neon (ou qualquer host remoto) é recusado antes de qualquer escrita.
  assert.throws(() =>
    validarIdentidadePostgresLocal(
      {
        host: "ep-proud-bonus-acy2bafx.sa-east-1.aws.neon.tech",
        banco: "validacao_vazia",
        clusterName: "nuu-x-1",
      },
      esperado,
    ),
  );
  assert.throws(() =>
    validarIdentidadePostgresLocal(
      { host: "127.0.0.1", banco: "validacao_vazia", clusterName: "outro" },
      esperado,
    ),
  );
  assert.throws(() =>
    validarIdentidadePostgresLocal(
      { host: "127.0.0.1", banco: "neondb", clusterName: "nuu-x-1" },
      esperado,
    ),
  );
});

test("nome de banco é validado antes do CREATE DATABASE", () => {
  assert.equal(
    validarNomeBanco("validacao_cadeia_vazia"),
    "validacao_cadeia_vazia",
  );
  assert.throws(() => validarNomeBanco('x"; DROP DATABASE neondb; --'));
});

test("recorte reproduz as N primeiras migrations do journal", () => {
  const recorte = criarRecorteMigrations("./drizzle", 3);
  try {
    const journal = JSON.parse(
      readFileSync(join(recorte.pasta, "meta", "_journal.json"), "utf8"),
    ) as { entries: Array<{ tag: string }> };
    assert.equal(journal.entries.length, 3);
    for (const entrada of journal.entries) {
      assert.equal(
        readFileSync(join(recorte.pasta, `${entrada.tag}.sql`), "utf8"),
        readFileSync(join("./drizzle", `${entrada.tag}.sql`), "utf8"),
      );
    }
    assert.equal(
      readdirSync(recorte.pasta).filter((item) => item.endsWith(".sql")).length,
      3,
    );
  } finally {
    recorte.remover();
  }
  assert.equal(existsSync(recorte.pasta), false);
  assert.throws(() => criarRecorteMigrations("./drizzle", -1));
});

test("validação de migrations não cria nem remove recursos na Neon", () => {
  const script = readFileSync(
    "scripts/validar-e-aplicar-migrations.ts",
    "utf8",
  );
  assert.equal(script.includes('"POST"'), false);
  assert.equal(script.includes('"DELETE"'), false);
  assert.equal(
    /criarBranch|excluirBranch|criarBanco\(branch/.test(script),
    false,
  );
  assert.equal(script.includes("subirPostgresDescartavel"), true);
});
