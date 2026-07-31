import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { parse } from "dotenv";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";

const PROJETO_ESPERADO = "bold-waterfall-85845971";
const BRANCH_ESPERADA = "br-lucky-smoke-acg7fz8x";
const ENDPOINT_ESPERADO = "ep-proud-bonus-acy2bafx";
const BANCO_ESPERADO = "neondb";
const FINGERPRINT_ESTRUTURAL_ANTERIOR =
  "7efa668e4899a8ce4160336d27d876c26dfc0ea9b0d2b18fc2a2cfb327788c4d";
const SCHEMA_MIGRACOES = "drizzle_v2";
const TABELA_MIGRACOES = "__drizzle_migrations";
const PASTA_MIGRACOES = "./drizzle";
const TABELAS_NOVAS_ESPERADAS = [
  "atendimento_ia_auditorias",
  "atendimento_ia_avaliacoes",
  "atendimento_ia_conversas",
  "atendimento_ia_estados",
  "atendimento_ia_execucoes",
  "atendimento_ia_execucoes_ferramentas",
  "atendimento_ia_idempotencias",
  "atendimento_ia_memorias",
  "atendimento_ia_mensagens",
  "atendimento_ia_ocorrencias",
  "atendimento_ia_resumos",
  "atendimento_ia_transferencias",
].sort();

type LinhaCatalogo = Record<string, boolean | number | string | null>;

function carregarUrlProduction() {
  const ambiente = parse(readFileSync(".env"));
  const valor = ambiente.DATABASE_URL?.trim();

  if (!valor) throw new Error("DATABASE_URL principal ausente.");
  const url = new URL(valor);
  const endpoint = url.hostname.split(".")[0]?.replace(/-pooler$/, "");

  if (endpoint !== ENDPOINT_ESPERADO) {
    throw new Error("A DATABASE_URL não aponta para o endpoint da production.");
  }

  return valor;
}

async function validarIdentidade(cliente: Client) {
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
  const identidade = resultado.rows[0];

  if (
    identidade?.projeto_id !== PROJETO_ESPERADO ||
    identidade.branch_id !== BRANCH_ESPERADA ||
    identidade.endpoint_id !== ENDPOINT_ESPERADO ||
    identidade.banco !== BANCO_ESPERADO
  ) {
    throw new Error("Identidade Neon divergente; migration recusada.");
  }
}

async function calcularFingerprintEstruturalAnterior(cliente: Client) {
  const consultas = {
    tabelas: `
      SELECT schemaname AS esquema, tablename AS tabela
      FROM pg_catalog.pg_tables
      WHERE schemaname IN ('public', 'drizzle')
        AND (schemaname <> 'public' OR tablename NOT LIKE 'atendimento_ia_%')
      ORDER BY schemaname, tablename
    `,
    colunas: `
      SELECT table_schema AS esquema, table_name AS tabela,
        ordinal_position AS posicao, column_name AS coluna, data_type AS tipo,
        udt_name AS tipo_interno, is_nullable AS aceita_nulo,
        column_default AS valor_padrao
      FROM information_schema.columns
      WHERE table_schema IN ('public', 'drizzle')
        AND (table_schema <> 'public' OR table_name NOT LIKE 'atendimento_ia_%')
      ORDER BY table_schema, table_name, ordinal_position
    `,
    restricoes: `
      SELECT namespace.nspname AS esquema, tabela.relname AS tabela,
        restricao.conname AS nome, restricao.contype AS tipo,
        pg_get_constraintdef(restricao.oid, true) AS definicao
      FROM pg_catalog.pg_constraint restricao
      JOIN pg_catalog.pg_class tabela ON tabela.oid = restricao.conrelid
      JOIN pg_catalog.pg_namespace namespace ON namespace.oid = tabela.relnamespace
      WHERE namespace.nspname IN ('public', 'drizzle')
        AND (namespace.nspname <> 'public' OR tabela.relname NOT LIKE 'atendimento_ia_%')
      ORDER BY namespace.nspname, tabela.relname, restricao.conname
    `,
    indices: `
      SELECT schemaname AS esquema, tablename AS tabela,
        indexname AS nome, indexdef AS definicao
      FROM pg_catalog.pg_indexes
      WHERE schemaname IN ('public', 'drizzle')
        AND (schemaname <> 'public' OR tablename NOT LIKE 'atendimento_ia_%')
      ORDER BY schemaname, tablename, indexname
    `,
    enums: `
      SELECT namespace.nspname AS esquema, tipo.typname AS nome,
        enum.enumsortorder AS ordem, enum.enumlabel AS valor
      FROM pg_catalog.pg_type tipo
      JOIN pg_catalog.pg_enum enum ON enum.enumtypid = tipo.oid
      JOIN pg_catalog.pg_namespace namespace ON namespace.oid = tipo.typnamespace
      WHERE namespace.nspname = 'public'
        AND tipo.typname NOT LIKE 'atendimento_ia_%'
      ORDER BY namespace.nspname, tipo.typname, enum.enumsortorder
    `,
    sequencias: `
      SELECT sequence_schema AS esquema, sequence_name AS nome,
        data_type AS tipo, start_value AS valor_inicial,
        minimum_value AS valor_minimo, maximum_value AS valor_maximo,
        increment AS incremento, cycle_option AS ciclica
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
        AND sequence_name NOT LIKE 'atendimento_ia_%'
      ORDER BY sequence_schema, sequence_name
    `,
  };
  const catalogo: Record<string, LinhaCatalogo[]> = {};

  for (const [nome, sql] of Object.entries(consultas)) {
    catalogo[nome] = (await cliente.query<LinhaCatalogo>(sql)).rows;
  }

  return createHash("sha256")
    .update(JSON.stringify(catalogo))
    .digest("hex");
}

function escaparIdentificador(valor: string) {
  return `"${valor.replaceAll('"', '""')}"`;
}

async function calcularFingerprintDadosAnteriores(cliente: Client) {
  const tabelas = await cliente.query<{ tabela: string }>(`
    SELECT tablename AS tabela
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'atendimento_ia_%'
    ORDER BY tablename
  `);
  const resumo = [];

  for (const { tabela } of tabelas.rows) {
    const resultado = await cliente.query<{
      quantidade: string;
      hash_a: string;
      hash_b: string;
    }>(`
      SELECT count(*)::text AS quantidade,
        coalesce(sum(hashtextextended(to_jsonb(registro)::text, 17)::numeric), 0)::text AS hash_a,
        coalesce(sum(hashtextextended(to_jsonb(registro)::text, 73)::numeric), 0)::text AS hash_b
      FROM ${escaparIdentificador(tabela)} AS registro
    `);
    resumo.push({ tabela, ...resultado.rows[0] });
  }

  return createHash("sha256")
    .update(JSON.stringify(resumo))
    .digest("hex");
}

async function consultarEstado(url: string) {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();

  try {
    await cliente.query("BEGIN READ ONLY");
    await validarIdentidade(cliente);
    const estrutura = await calcularFingerprintEstruturalAnterior(cliente);
    const dados = await calcularFingerprintDadosAnteriores(cliente);
    const tabelasAtendimento = await cliente.query<{ tabela: string }>(`
      SELECT tablename AS tabela
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public' AND tablename LIKE 'atendimento_ia_%'
      ORDER BY tablename
    `);
    const rastreamento = await cliente.query<{
      created_at: string;
      hash: string;
    }>(`
      SELECT hash, created_at::text
      FROM ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}
      ORDER BY created_at
    `);
    const orfa = await cliente.query<{ existe: boolean }>(`
      SELECT to_regclass('public.diagnosticos_cotacoes_frete_paralelas') IS NOT NULL AS existe
    `);
    await cliente.query("COMMIT");

    return {
      estrutura,
      dados,
      tabelasAtendimento: tabelasAtendimento.rows.map(({ tabela }) => tabela),
      rastreamento: rastreamento.rows,
      tabelaOrfaPresente: orfa.rows[0]?.existe ?? false,
    };
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }
}

function validarArquivosLocais() {
  const migrations = readMigrationFiles({ migrationsFolder: PASTA_MIGRACOES });

  if (migrations.length !== 2) {
    throw new Error("A sequência ativa deve conter baseline e migration 0001.");
  }

  const sqlMigration = readFileSync(
    "drizzle/0001_estruturas_atendimento_ia.sql",
    "utf8",
  );

  if (
    /^(DROP|DELETE|TRUNCATE|UPDATE|INSERT)\b/im.test(sqlMigration) ||
    /ALTER TABLE "(?!atendimento_ia_)/i.test(sqlMigration)
  ) {
    throw new Error("A migration contém operação fora do domínio autorizado.");
  }

  return migrations;
}

async function executar() {
  const url = carregarUrlProduction();
  const migrations = validarArquivosLocais();
  const antes = await consultarEstado(url);
  const modo = process.argv[2] ?? "--aplicar";

  if (modo === "--validar-no-op") {
    if (
      antes.estrutura !== FINGERPRINT_ESTRUTURAL_ANTERIOR ||
      !antes.tabelaOrfaPresente ||
      JSON.stringify(antes.tabelasAtendimento) !==
        JSON.stringify(TABELAS_NOVAS_ESPERADAS) ||
      antes.rastreamento.length !== 2 ||
      antes.rastreamento.some(
        (registro, indice) =>
          registro.hash !== migrations[indice]?.hash ||
          Number(registro.created_at) !== migrations[indice]?.folderMillis,
      )
    ) {
      throw new Error("Estado aplicado divergente; migrator no-op recusado.");
    }

    const poolNoOp = new Pool({ connectionString: url, max: 1 });

    try {
      await migrate(drizzle(poolNoOp), {
        migrationsFolder: PASTA_MIGRACOES,
        migrationsSchema: SCHEMA_MIGRACOES,
        migrationsTable: TABELA_MIGRACOES,
      });
    } finally {
      await poolNoOp.end();
    }

    const depoisNoOp = await consultarEstado(url);

    if (JSON.stringify(antes) !== JSON.stringify(depoisNoOp)) {
      throw new Error("O migrator não apresentou comportamento no-op.");
    }

    console.log(
      JSON.stringify(
        {
          alvo: "production",
          migratorNoOp: true,
          migrationsRegistradas: depoisNoOp.rastreamento.length,
          objetosAnterioresPreservados: true,
          dadosAnterioresPreservados: true,
          tabelaOrfaPreservada: depoisNoOp.tabelaOrfaPresente,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (modo !== "--aplicar") {
    throw new Error("Use --aplicar ou --validar-no-op explicitamente.");
  }

  if (
    antes.estrutura !== FINGERPRINT_ESTRUTURAL_ANTERIOR ||
    antes.tabelasAtendimento.length !== 0 ||
    !antes.tabelaOrfaPresente ||
    antes.rastreamento.length !== 1 ||
    antes.rastreamento[0]?.hash !== migrations[0]?.hash ||
    Number(antes.rastreamento[0]?.created_at) !== migrations[0]?.folderMillis
  ) {
    throw new Error("Estado anterior divergente; nenhuma migration foi aplicada.");
  }

  const pool = new Pool({ connectionString: url, max: 1 });

  try {
    await migrate(drizzle(pool), {
      migrationsFolder: PASTA_MIGRACOES,
      migrationsSchema: SCHEMA_MIGRACOES,
      migrationsTable: TABELA_MIGRACOES,
    });
  } finally {
    await pool.end();
  }

  const depois = await consultarEstado(url);

  if (
    depois.estrutura !== antes.estrutura ||
    depois.dados !== antes.dados ||
    !depois.tabelaOrfaPresente ||
    JSON.stringify(depois.tabelasAtendimento) !==
      JSON.stringify(TABELAS_NOVAS_ESPERADAS) ||
    depois.rastreamento.length !== 2 ||
    depois.rastreamento[1]?.hash !== migrations[1]?.hash ||
    Number(depois.rastreamento[1]?.created_at) !== migrations[1]?.folderMillis
  ) {
    throw new Error("Validação posterior à migration falhou.");
  }

  console.log(
    JSON.stringify(
      {
        alvo: "production",
        migration: "0001_estruturas_atendimento_ia",
        tabelasCriadas: depois.tabelasAtendimento,
        objetosAnterioresPreservados: antes.estrutura === depois.estrutura,
        dadosAnterioresPreservados: antes.dados === depois.dados,
        tabelaOrfaPreservada: depois.tabelaOrfaPresente,
        migrationsRegistradas: depois.rastreamento.length,
      },
      null,
      2,
    ),
  );
}

executar().catch((erro) => {
  const mensagem =
    erro instanceof Error ? erro.message : "Falha desconhecida na migration.";
  console.error(
    `[estruturas-atendimento-ia] ${mensagem.replace(/postgres(?:ql)?:\/\/\S+/gi, "[URL_REMOVIDA]")}`,
  );
  process.exit(1);
});
