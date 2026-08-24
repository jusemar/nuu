import assert from "node:assert/strict";
import test from "node:test";

import {
  ANCORA_MIGRATIONS,
  type EntradaJournalValidacao,
  type MigrationLocalValidacao,
  type SnapshotDrizzle,
  validarDeltaSnapshots,
  validarHistoricoAplicado,
  validarIdentidadeBanco,
  validarSequenciaLocal,
} from "./validar-cadeia-migrations";

function cadeiaValida() {
  const entradas: EntradaJournalValidacao[] = Array.from(
    { length: ANCORA_MIGRATIONS.total },
    (_, idx) => ({
      idx,
      tag: `${idx.toString().padStart(4, "0")}_migration_${idx}`,
      when: 1_000 + idx,
    }),
  );
  entradas[ANCORA_MIGRATIONS.ultimoIndice]!.tag = ANCORA_MIGRATIONS.ultimaTag;
  const migrations: MigrationLocalValidacao[] = entradas.map((entrada) => ({
    hash: `hash-${entrada.idx}`,
    folderMillis: entrada.when,
  }));
  return { entradas, migrations };
}

test("aceita somente a cadeia legítima ancorada em 0032", () => {
  const { entradas, migrations } = cadeiaValida();
  assert.doesNotThrow(() => validarSequenciaLocal(migrations, entradas));
});

test("rejeita migration ausente, duplicada ou fora de sequência", () => {
  const ausente = cadeiaValida();
  ausente.entradas.splice(10, 1);
  ausente.migrations.splice(10, 1);
  assert.throws(() =>
    validarSequenciaLocal(ausente.migrations, ausente.entradas),
  );

  const duplicada = cadeiaValida();
  duplicada.entradas[8]!.tag = duplicada.entradas[7]!.tag;
  assert.throws(() =>
    validarSequenciaLocal(duplicada.migrations, duplicada.entradas),
  );

  const quebrada = cadeiaValida();
  quebrada.entradas[12]!.idx = 13;
  assert.throws(() =>
    validarSequenciaLocal(quebrada.migrations, quebrada.entradas),
  );
});

test("rejeita última tag, índice ou correspondência com o journal divergentes", () => {
  const tag = cadeiaValida();
  tag.entradas.at(-1)!.tag = "0032_nao_autorizada";
  assert.throws(() => validarSequenciaLocal(tag.migrations, tag.entradas));

  const indice = cadeiaValida();
  indice.entradas.at(-1)!.idx = 33;
  assert.throws(() =>
    validarSequenciaLocal(indice.migrations, indice.entradas),
  );

  const timestamp = cadeiaValida();
  timestamp.migrations[5]!.folderMillis += 1;
  assert.throws(() =>
    validarSequenciaLocal(timestamp.migrations, timestamp.entradas),
  );
});

test("rejeita hash antigo divergente e aceita somente prefixo íntegro do banco", () => {
  const { migrations } = cadeiaValida();
  const aplicadas = migrations.slice(0, 29).map((migration) => ({
    hash: migration.hash,
    createdAt: migration.folderMillis,
  }));
  assert.doesNotThrow(() => validarHistoricoAplicado(aplicadas, migrations));
  aplicadas[4]!.hash = "alterado";
  assert.throws(() => validarHistoricoAplicado(aplicadas, migrations));
});

test("aceita somente o delta autorizado entre os snapshots 0028 e 0029", () => {
  const anterior: SnapshotDrizzle = {
    id: "snapshot-28",
    prevId: "snapshot-26",
    tables: { "public.existente": { nome: "existente" } },
    enums: {},
    schemas: {},
    sequences: {},
    roles: {},
    policies: {},
    views: {},
  };
  const atual: SnapshotDrizzle = {
    ...structuredClone(anterior),
    id: "snapshot-29",
    prevId: anterior.id,
    tables: {
      ...anterior.tables,
      "public.grupo_paginas": {},
      "public.grupos_navegacao": {},
      "public.paginas_dinamicas": {},
    },
    enums: {
      "public.grupo_navegacao_local": {},
      "public.pagina_dinamica_status": {},
    },
  };
  assert.doesNotThrow(() => validarDeltaSnapshots(anterior, atual));
  atual.tables["public.existente"] = { alterada: true };
  assert.throws(() => validarDeltaSnapshots(anterior, atual));
});

test("recusa endpoint de produção e qualquer identidade divergente", () => {
  const esperado = {
    banco: "neondb",
    usuario: "neondb_owner",
    projetoId: "projeto-autorizado",
    branchId: "br-frosty-sea-acjpjuxk",
    endpointId: "ep-quiet-bar-acb7yly2",
  };
  const producao = {
    branchId: "br-lucky-smoke-acg7fz8x",
    endpointId: "ep-proud-bonus-acy2bafx",
  };
  assert.doesNotThrow(() =>
    validarIdentidadeBanco(esperado, esperado, producao),
  );
  assert.throws(() =>
    validarIdentidadeBanco(
      { ...esperado, endpointId: producao.endpointId },
      esperado,
      producao,
    ),
  );
});
