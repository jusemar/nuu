import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { parse } from "dotenv";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";

type IdentidadeNeon = {
  banco: string;
  projetoId: string;
  branchId: string;
  endpointId: string;
};

type Alvo = "clone" | "vazio";

const PASTA_MIGRACOES = "./drizzle";
const SCHEMA_MIGRACOES = "drizzle_v2";
const TABELA_MIGRACOES = "__drizzle_migrations";
const BANCO_VAZIO = "baseline_vazio";
const ENDPOINT_CLONE = "ep-rapid-voice-acecqcwd";
const ENDPOINT_VAZIO = "ep-calm-sunset-acbm8l2l";
const TABELA_ORFA = "diagnosticos_cotacoes_frete_paralelas";

function lerAmbiente(caminho: string) {
  return parse(readFileSync(caminho));
}

function exigirTexto(valor: string | undefined, nome: string) {
  const texto = valor?.trim();

  if (!texto) throw new Error(`Configuração obrigatória ausente: ${nome}.`);
  return texto;
}

function carregarUrls() {
  const principal = lerAmbiente(".env");
  const clone = lerAmbiente(".env.baseline-clone.local");
  const vazio = lerAmbiente(".env.baseline-vazio.local");

  if (
    clone.BASELINE_CLONE_DESCARTAVEL !== "SIM" ||
    vazio.BASELINE_VAZIO_DESCARTAVEL !== "SIM"
  ) {
    throw new Error("Os alvos não estão explicitamente marcados como descartáveis.");
  }

  return {
    principal: exigirTexto(principal.DATABASE_URL, "DATABASE_URL"),
    clone: exigirTexto(
      clone.DATABASE_URL_BASELINE_CLONE,
      "DATABASE_URL_BASELINE_CLONE",
    ),
    vazio: exigirTexto(
      vazio.DATABASE_URL_BASELINE_VAZIO,
      "DATABASE_URL_BASELINE_VAZIO",
    ),
  };
}

async function consultarIdentidade(url: string): Promise<IdentidadeNeon> {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();

  try {
    await cliente.query("BEGIN READ ONLY");
    const resultado = await cliente.query<{
      banco: string;
      branch_id: string | null;
      endpoint_id: string | null;
      projeto_id: string | null;
    }>(`
      SELECT
        current_database() AS banco,
        current_setting('neon.project_id', true) AS projeto_id,
        current_setting('neon.branch_id', true) AS branch_id,
        current_setting('neon.endpoint_id', true) AS endpoint_id
    `);
    await cliente.query("COMMIT");
    const linha = resultado.rows[0];

    if (!linha?.projeto_id || !linha.branch_id || !linha.endpoint_id) {
      throw new Error("Identidade técnica Neon incompleta.");
    }

    return {
      banco: linha.banco,
      projetoId: linha.projeto_id,
      branchId: linha.branch_id,
      endpointId: linha.endpoint_id,
    };
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }
}

async function validarAlvo(alvo: Alvo) {
  const urls = carregarUrls();
  const urlAlvo = alvo === "vazio" ? urls.vazio : urls.clone;

  if (urlAlvo === urls.principal || urlAlvo === urls.clone && alvo === "vazio") {
    throw new Error("Operação recusada: URL de destino protegida.");
  }

  const [principal, clone, vazio] = await Promise.all([
    consultarIdentidade(urls.principal),
    consultarIdentidade(urls.clone),
    consultarIdentidade(urls.vazio),
  ]);

  if (
    principal.projetoId !== clone.projetoId ||
    principal.projetoId !== vazio.projetoId
  ) {
    throw new Error("Operação recusada: os alvos pertencem a projetos diferentes.");
  }

  if (
    new Set([principal.branchId, clone.branchId, vazio.branchId]).size !== 3 ||
    new Set([principal.endpointId, clone.endpointId, vazio.endpointId]).size !==
      3
  ) {
    throw new Error("Operação recusada: branch ou endpoint não está isolado.");
  }

  if (
    clone.endpointId !== ENDPOINT_CLONE ||
    vazio.endpointId !== ENDPOINT_VAZIO ||
    vazio.banco !== BANCO_VAZIO
  ) {
    throw new Error("Operação recusada: identidade descartável inesperada.");
  }

  const identidadeAlvo = alvo === "vazio" ? vazio : clone;

  return {
    urlAlvo,
    identidadeAlvo,
    identidadePrincipal: principal,
  };
}

async function consultarFingerprintEstrutural(cliente: Client) {
  const resultado = await cliente.query<Record<string, unknown>>(`
    SELECT 'tabela' AS objeto, schemaname AS esquema, tablename AS nome, NULL::text AS detalhe
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'

    UNION ALL

    SELECT
      'coluna',
      table_schema,
      table_name || '.' || column_name,
      concat_ws('|', ordinal_position, data_type, udt_name, is_nullable, column_default)
    FROM information_schema.columns
    WHERE table_schema = 'public'

    UNION ALL

    SELECT
      'restricao',
      namespace.nspname,
      tabela.relname || '.' || restricao.conname,
      pg_get_constraintdef(restricao.oid, true)
    FROM pg_catalog.pg_constraint restricao
    JOIN pg_catalog.pg_class tabela ON tabela.oid = restricao.conrelid
    JOIN pg_catalog.pg_namespace namespace ON namespace.oid = tabela.relnamespace
    WHERE namespace.nspname = 'public'

    UNION ALL

    SELECT
      'indice',
      schemaname,
      tablename || '.' || indexname,
      indexdef
    FROM pg_catalog.pg_indexes
    WHERE schemaname = 'public'

    UNION ALL

    SELECT
      'enum',
      namespace.nspname,
      tipo.typname || '.' || enum.enumlabel,
      enum.enumsortorder::text
    FROM pg_catalog.pg_type tipo
    JOIN pg_catalog.pg_enum enum ON enum.enumtypid = tipo.oid
    JOIN pg_catalog.pg_namespace namespace ON namespace.oid = tipo.typnamespace
    WHERE namespace.nspname = 'public'

    UNION ALL

    SELECT
      'sequencia',
      sequence_schema,
      sequence_name,
      concat_ws('|', data_type, start_value, minimum_value, maximum_value, increment, cycle_option)
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'

    ORDER BY objeto, esquema, nome, detalhe
  `);

  return createHash("sha256")
    .update(JSON.stringify(resultado.rows))
    .digest("hex");
}

function escaparIdentificador(valor: string) {
  return `"${valor.replaceAll('"', '""')}"`;
}

async function consultarFingerprintDados(cliente: Client) {
  const tabelas = await cliente.query<{ tabela: string }>(`
    SELECT tablename AS tabela
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  const resumo: Array<{
    tabela: string;
    quantidade: string;
    hashA: string;
    hashB: string;
  }> = [];

  for (const { tabela } of tabelas.rows) {
    const identificador = escaparIdentificador(tabela);
    const resultado = await cliente.query<{
      quantidade: string;
      hash_a: string;
      hash_b: string;
    }>(`
      SELECT
        count(*)::text AS quantidade,
        coalesce(sum(hashtextextended(to_jsonb(registro)::text, 17)::numeric), 0)::text AS hash_a,
        coalesce(sum(hashtextextended(to_jsonb(registro)::text, 73)::numeric), 0)::text AS hash_b
      FROM ${identificador} AS registro
    `);
    const linha = resultado.rows[0];

    resumo.push({
      tabela,
      quantidade: linha?.quantidade ?? "0",
      hashA: linha?.hash_a ?? "0",
      hashB: linha?.hash_b ?? "0",
    });
  }

  return createHash("sha256")
    .update(JSON.stringify(resumo))
    .digest("hex");
}

async function obterFingerprints(url: string) {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();

  try {
    await cliente.query("BEGIN READ ONLY");
    const [estrutura, dados] = await Promise.all([
      consultarFingerprintEstrutural(cliente),
      consultarFingerprintDados(cliente),
    ]);
    await cliente.query("COMMIT");
    return { estrutura, dados };
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }
}

async function executarMigrator(url: string) {
  const pool = new Pool({ connectionString: url, max: 1 });
  const banco = drizzle(pool);

  try {
    await migrate(banco, {
      migrationsFolder: PASTA_MIGRACOES,
      migrationsSchema: SCHEMA_MIGRACOES,
      migrationsTable: TABELA_MIGRACOES,
    });
  } finally {
    await pool.end();
  }
}

async function consultarRastreamento(url: string) {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();

  try {
    const resultado = await cliente.query<{ quantidade: string }>(`
      SELECT count(*)::text AS quantidade
      FROM ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}
    `);
    return Number(resultado.rows[0]?.quantidade ?? "0");
  } finally {
    await cliente.end();
  }
}

async function aplicarNoVazio() {
  const { urlAlvo } = await validarAlvo("vazio");
  const antes = await obterFingerprints(urlAlvo);
  await executarMigrator(urlAlvo);
  const depois = await obterFingerprints(urlAlvo);

  console.log(
    JSON.stringify(
      {
        alvo: "baseline-criacao-vazia/baseline_vazio",
        migrationsRegistradas: await consultarRastreamento(urlAlvo),
        fingerprints: { antes, depois },
      },
      null,
      2,
    ),
  );
}

async function aplicarStampNoClone() {
  const { urlAlvo } = await validarAlvo("clone");
  const migrations = readMigrationFiles({
    migrationsFolder: PASTA_MIGRACOES,
  });

  if (migrations.length !== 1) {
    throw new Error("O stamp exige exatamente uma baseline ativa.");
  }

  const baseline = migrations[0];
  const antes = await obterFingerprints(urlAlvo);
  const cliente = new Client({ connectionString: urlAlvo });
  await cliente.connect();

  try {
    await cliente.query("BEGIN");
    await cliente.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA_MIGRACOES}`);
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES} (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);
    const existentes = await cliente.query<{
      created_at: string;
      hash: string;
    }>(`
      SELECT hash, created_at::text
      FROM ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}
      ORDER BY created_at
    `);

    if (existentes.rows.length === 0) {
      await cliente.query(
        `
          INSERT INTO ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES} (hash, created_at)
          VALUES ($1, $2)
        `,
        [baseline.hash, baseline.folderMillis],
      );
    } else if (
      existentes.rows.length !== 1 ||
      existentes.rows[0]?.hash !== baseline.hash ||
      Number(existentes.rows[0]?.created_at) !== baseline.folderMillis
    ) {
      throw new Error("Rastreamento v2 existente não corresponde à baseline.");
    }

    await cliente.query("COMMIT");
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }

  const depois = await obterFingerprints(urlAlvo);

  if (antes.estrutura !== depois.estrutura || antes.dados !== depois.dados) {
    throw new Error("O stamp alterou estrutura pública ou dados do clone.");
  }

  const verificacaoOrfa = new Client({ connectionString: urlAlvo });
  await verificacaoOrfa.connect();
  const orfa = await verificacaoOrfa.query<{ existe: boolean }>(
    `
      SELECT to_regclass($1) IS NOT NULL AS existe
    `,
    [`public.${TABELA_ORFA}`],
  );
  await verificacaoOrfa.end();

  if (!orfa.rows[0]?.existe) {
    throw new Error("A tabela órfã não foi preservada no clone.");
  }

  console.log(
    JSON.stringify(
      {
        alvo: "baseline-adocao-clone",
        stamp: "aplicado-ou-ja-existente",
        migrationsRegistradas: await consultarRastreamento(urlAlvo),
        fingerprints: { antes, depois },
        tabelaOrfaPreservada: true,
      },
      null,
      2,
    ),
  );
}

async function migrarClone() {
  const { urlAlvo } = await validarAlvo("clone");
  const antes = await obterFingerprints(urlAlvo);
  const rastreamentoAntes = await consultarRastreamento(urlAlvo);
  await executarMigrator(urlAlvo);
  const depois = await obterFingerprints(urlAlvo);
  const rastreamentoDepois = await consultarRastreamento(urlAlvo);

  if (
    antes.estrutura !== depois.estrutura ||
    antes.dados !== depois.dados ||
    rastreamentoAntes !== rastreamentoDepois
  ) {
    throw new Error("O migrator não apresentou comportamento no-op no clone.");
  }

  console.log(
    JSON.stringify(
      {
        alvo: "baseline-adocao-clone",
        noOp: true,
        migrationsRegistradas: rastreamentoDepois,
        fingerprints: { antes, depois },
      },
      null,
      2,
    ),
  );
}

async function aplicarNoClone() {
  const { urlAlvo } = await validarAlvo("clone");
  const antes = await obterFingerprints(urlAlvo);
  await executarMigrator(urlAlvo);
  const depois = await obterFingerprints(urlAlvo);

  console.log(
    JSON.stringify(
      {
        alvo: "baseline-adocao-clone",
        migrationsRegistradas: await consultarRastreamento(urlAlvo),
        fingerprints: { antes, depois },
      },
      null,
      2,
    ),
  );
}

async function restaurarRastreamentoSintetico(alvo: Alvo) {
  const { urlAlvo } = await validarAlvo(alvo);
  const migrations = readMigrationFiles({
    migrationsFolder: PASTA_MIGRACOES,
  });

  if (migrations.length !== 3) {
    throw new Error("A restauração exige baseline, criação e reversão sintéticas.");
  }

  const baseline = migrations[0];
  const antes = await obterFingerprints(urlAlvo);
  const cliente = new Client({ connectionString: urlAlvo });
  await cliente.connect();

  try {
    await cliente.query("BEGIN");
    const tabelaSintetica = await cliente.query<{ existe: boolean }>(
      "SELECT to_regclass('public.teste_migration_sintetica') IS NOT NULL AS existe",
    );
    const rastreamento = await cliente.query<{
      created_at: string;
      hash: string;
    }>(`
      SELECT hash, created_at::text
      FROM ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}
      ORDER BY created_at
    `);

    if (tabelaSintetica.rows[0]?.existe) {
      throw new Error("O objeto sintético ainda existe; restauração recusada.");
    }

    if (
      rastreamento.rows.length !== migrations.length ||
      rastreamento.rows.some(
        (linha, indice) =>
          linha.hash !== migrations[indice]?.hash ||
          Number(linha.created_at) !== migrations[indice]?.folderMillis,
      )
    ) {
      throw new Error("O rastreamento não corresponde ao ciclo sintético completo.");
    }

    await cliente.query(
      `
        DELETE FROM ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}
        WHERE created_at <> $1
      `,
      [baseline.folderMillis],
    );
    await cliente.query("COMMIT");
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }

  const depois = await obterFingerprints(urlAlvo);

  if (antes.estrutura !== depois.estrutura || antes.dados !== depois.dados) {
    throw new Error("A restauração alterou estrutura pública ou dados.");
  }

  console.log(
    JSON.stringify(
      {
        alvo:
          alvo === "vazio"
            ? "baseline-criacao-vazia/baseline_vazio"
            : "baseline-adocao-clone",
        rastreamentoRestaurado: true,
        migrationsRegistradas: await consultarRastreamento(urlAlvo),
        fingerprints: { antes, depois },
      },
      null,
      2,
    ),
  );
}

const comando = process.argv[2];

const execucao =
  comando === "aplicar-vazio"
    ? aplicarNoVazio()
    : comando === "stamp-clone"
      ? aplicarStampNoClone()
      : comando === "aplicar-clone"
        ? aplicarNoClone()
        : comando === "migrar-clone"
          ? migrarClone()
          : comando === "restaurar-testes-vazio"
            ? restaurarRastreamentoSintetico("vazio")
            : comando === "restaurar-testes-clone"
              ? restaurarRastreamentoSintetico("clone")
              : Promise.reject(
                  new Error(
                    "Use aplicar-vazio, stamp-clone, aplicar-clone, migrar-clone, restaurar-testes-vazio ou restaurar-testes-clone explicitamente.",
                  ),
                );

execucao.catch((erro) => {
  const mensagem =
    erro instanceof Error ? erro.message : "Falha desconhecida na regularização.";
  console.error(`[migrations-descartaveis] ${mensagem}`);
  process.exit(1);
});
