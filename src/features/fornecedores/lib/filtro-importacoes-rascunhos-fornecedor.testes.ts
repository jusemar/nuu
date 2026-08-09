import assert from "node:assert/strict";
import test from "node:test";

import { PgDialect } from "drizzle-orm/pg-core";

import { filtrarRascunhosPorImportacoesFornecedor } from "./filtro-importacoes-rascunhos-fornecedor";

const dialeto = new PgDialect();

function gerar(importacaoIds: string[]) {
  return dialeto.sqlToQuery(
    filtrarRascunhosPorImportacoesFornecedor(importacaoIds),
  );
}

const UM = "0780c176-0000-0000-0000-000000000001";
const DOIS = "4857fec4-0000-0000-0000-000000000002";
const TRES = "c0ffee00-0000-0000-0000-000000000003";

test("uma importação gera IN com um placeholder", () => {
  const consulta = gerar([UM]);

  assert.match(consulta.sql, /in \(\$1\)/);
  assert.deepEqual(consulta.params, [UM]);
});

test("várias importações geram um placeholder por id", () => {
  const consulta = gerar([UM, DOIS, TRES]);

  assert.match(consulta.sql, /in \(\$1, \$2, \$3\)/);
  assert.deepEqual(consulta.params, [UM, DOIS, TRES]);
});

test("nenhuma importação não casa nada, em vez de estourar", () => {
  const consulta = gerar([]);

  assert.equal(consulta.sql, "false");
  assert.deepEqual(consulta.params, []);
});

/**
 * Regressão do erro que derrubou a tela de importações.
 *
 * `= ANY(${ids})` dentro de um template `sql` não produz array em SQL: o
 * Drizzle expande a lista em parâmetros separados. O Postgres recusava com
 * 22P02 (um id) e 42809 (vários).
 */
test("não usa ANY, que exige array do lado direito", () => {
  for (const ids of [[UM], [UM, DOIS], [UM, DOIS, TRES]]) {
    assert.doesNotMatch(gerar(ids).sql, /ANY/i);
  }
});

test("os ids nunca entram no texto da consulta", () => {
  const consulta = gerar([UM, DOIS]);

  // Parametrizado de verdade: nenhum id aparece interpolado no SQL.
  assert.doesNotMatch(consulta.sql, new RegExp(UM));
  assert.doesNotMatch(consulta.sql, new RegExp(DOIS));
  assert.equal(consulta.params.length, 2);
});

test("lê a execução de dentro do JSON de origem do rascunho", () => {
  const consulta = gerar([UM]);

  assert.match(consulta.sql, /dados_origem_json/);
  assert.match(consulta.sql, /origemFluxoFornecedor/);
  assert.match(consulta.sql, /importacaoId/);
});
