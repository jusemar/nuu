import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { parse } from "dotenv";
import { getTableName, is } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PgTable } from "drizzle-orm/pg-core";
import { Client, Pool } from "pg";

import * as schemaAtual from "../src/db/schema";

type IdentidadeNeon = {
  banco: string;
  projetoId: string;
  branchId: string;
  endpointId: string;
};

type LinhaCatalogo = Record<string, boolean | number | string | null>;

const CAMINHO_AMBIENTE = ".env";
const PASTA_MIGRACOES = "./drizzle";
const SCHEMA_MIGRACOES = "drizzle_v2";
const TABELA_MIGRACOES = "__drizzle_migrations";
const TABELA_ORFA = "diagnosticos_cotacoes_frete_paralelas";

const PROJETO_ESPERADO = "bold-waterfall-85845971";
const BRANCH_ESPERADA = "br-lucky-smoke-acg7fz8x";
const ENDPOINT_ESPERADO = "ep-proud-bonus-acy2bafx";
const BANCO_ESPERADO = "neondb";
const FINGERPRINT_ESTRUTURAL_ESPERADO =
  "7efa668e4899a8ce4160336d27d876c26dfc0ea9b0d2b18fc2a2cfb327788c4d";
const CONFIRMACAO_EXIGIDA = "ADOTAR_BASELINE_NA_PRODUCTION";
const CONFIRMACAO_NO_OP_EXIGIDA = "VALIDAR_MIGRATOR_NO_OP_NA_PRODUCTION";

function exigirTexto(valor: string | undefined, nome: string) {
  const texto = valor?.trim();

  if (!texto) throw new Error(`Configuração obrigatória ausente: ${nome}.`);
  return texto;
}

function carregarUrlPrincipal() {
  const ambiente = parse(readFileSync(CAMINHO_AMBIENTE));
  const valor = exigirTexto(ambiente.DATABASE_URL, "DATABASE_URL");
  const url = new URL(valor);
  const endpoint = url.hostname.split(".")[0]?.replace(/-pooler$/, "");

  if (endpoint !== ENDPOINT_ESPERADO) {
    throw new Error("A DATABASE_URL local não aponta para o endpoint esperado.");
  }

  return valor;
}

async function consultarIdentidade(cliente: Client): Promise<IdentidadeNeon> {
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
  const linha = resultado.rows[0];

  if (!linha?.projeto_id || !linha.branch_id || !linha.endpoint_id) {
    throw new Error("A conexão não forneceu a identidade técnica Neon.");
  }

  return {
    banco: linha.banco,
    projetoId: linha.projeto_id,
    branchId: linha.branch_id,
    endpointId: linha.endpoint_id,
  };
}

function validarIdentidade(identidade: IdentidadeNeon) {
  if (
    identidade.projetoId !== PROJETO_ESPERADO ||
    identidade.branchId !== BRANCH_ESPERADA ||
    identidade.endpointId !== ENDPOINT_ESPERADO ||
    identidade.banco !== BANCO_ESPERADO
  ) {
    throw new Error("Identidade da production divergente; operação abortada.");
  }
}

async function consultarCatalogo(cliente: Client) {
  const consultas = {
    tabelas: `
      SELECT schemaname AS esquema, tablename AS tabela
      FROM pg_catalog.pg_tables
      WHERE schemaname IN ('public', 'drizzle')
      ORDER BY schemaname, tablename
    `,
    colunas: `
      SELECT
        table_schema AS esquema,
        table_name AS tabela,
        ordinal_position AS posicao,
        column_name AS coluna,
        data_type AS tipo,
        udt_name AS tipo_interno,
        is_nullable AS aceita_nulo,
        column_default AS valor_padrao
      FROM information_schema.columns
      WHERE table_schema IN ('public', 'drizzle')
      ORDER BY table_schema, table_name, ordinal_position
    `,
    restricoes: `
      SELECT
        namespace.nspname AS esquema,
        tabela.relname AS tabela,
        restricao.conname AS nome,
        restricao.contype AS tipo,
        pg_get_constraintdef(restricao.oid, true) AS definicao
      FROM pg_catalog.pg_constraint restricao
      JOIN pg_catalog.pg_class tabela ON tabela.oid = restricao.conrelid
      JOIN pg_catalog.pg_namespace namespace ON namespace.oid = tabela.relnamespace
      WHERE namespace.nspname IN ('public', 'drizzle')
      ORDER BY namespace.nspname, tabela.relname, restricao.conname
    `,
    indices: `
      SELECT
        schemaname AS esquema,
        tablename AS tabela,
        indexname AS nome,
        indexdef AS definicao
      FROM pg_catalog.pg_indexes
      WHERE schemaname IN ('public', 'drizzle')
      ORDER BY schemaname, tablename, indexname
    `,
    enums: `
      SELECT
        namespace.nspname AS esquema,
        tipo.typname AS nome,
        enum.enumsortorder AS ordem,
        enum.enumlabel AS valor
      FROM pg_catalog.pg_type tipo
      JOIN pg_catalog.pg_enum enum ON enum.enumtypid = tipo.oid
      JOIN pg_catalog.pg_namespace namespace ON namespace.oid = tipo.typnamespace
      WHERE namespace.nspname = 'public'
      ORDER BY namespace.nspname, tipo.typname, enum.enumsortorder
    `,
    sequencias: `
      SELECT
        sequence_schema AS esquema,
        sequence_name AS nome,
        data_type AS tipo,
        start_value AS valor_inicial,
        minimum_value AS valor_minimo,
        maximum_value AS valor_maximo,
        increment AS incremento,
        cycle_option AS ciclica
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
      ORDER BY sequence_schema, sequence_name
    `,
  };
  const catalogo: Record<string, LinhaCatalogo[]> = {};

  for (const [nome, sql] of Object.entries(consultas)) {
    const resultado = await cliente.query<LinhaCatalogo>(sql);
    catalogo[nome] = resultado.rows;
  }

  return catalogo;
}

function calcularFingerprintEstrutural(
  catalogo: Record<string, LinhaCatalogo[]>,
) {
  return createHash("sha256")
    .update(JSON.stringify(catalogo))
    .digest("hex");
}

function escaparIdentificador(valor: string) {
  return `"${valor.replaceAll('"', '""')}"`;
}

async function calcularFingerprintDados(cliente: Client) {
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
    const resultado = await cliente.query<{
      quantidade: string;
      hash_a: string;
      hash_b: string;
    }>(`
      SELECT
        count(*)::text AS quantidade,
        coalesce(sum(hashtextextended(to_jsonb(registro)::text, 17)::numeric), 0)::text AS hash_a,
        coalesce(sum(hashtextextended(to_jsonb(registro)::text, 73)::numeric), 0)::text AS hash_b
      FROM ${escaparIdentificador(tabela)} AS registro
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

function listarTabelasAdministradas(): string[] {
  return [
    ...new Set(
      Object.values(schemaAtual)
        .filter((valor) => is(valor, PgTable))
        .map((tabela) => getTableName(tabela)),
    ),
  ].sort();
}

function validarEstrutura(
  catalogo: Record<string, LinhaCatalogo[]>,
  fingerprint: string,
) {
  const tabelasAdministradas = listarTabelasAdministradas();
  const tabelasPublicas = (catalogo.tabelas ?? [])
    .filter((item) => item.esquema === "public")
    .map((item) => String(item.tabela))
    .sort();
  const ausentes = tabelasAdministradas.filter(
    (tabela) => !tabelasPublicas.includes(tabela),
  );
  const extras = tabelasPublicas.filter(
    (tabela) => !tabelasAdministradas.includes(tabela),
  );

  if (
    fingerprint !== FINGERPRINT_ESTRUTURAL_ESPERADO ||
    tabelasAdministradas.length !== 80 ||
    ausentes.length > 0 ||
    extras.length !== 1 ||
    extras[0] !== TABELA_ORFA
  ) {
    throw new Error("Estrutura da production divergente; operação abortada.");
  }

  return {
    tabelasAdministradas: tabelasAdministradas.length,
    tabelaOrfaPresente: true,
    tabelasExtras: extras,
  };
}

function obterBaselineUnica() {
  const migrations = readMigrationFiles({ migrationsFolder: PASTA_MIGRACOES });

  if (migrations.length !== 1) {
    throw new Error("A sequência ativa deve conter exatamente uma baseline.");
  }

  return migrations[0];
}

async function inspecionarSomenteLeitura(url: string) {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();

  try {
    await cliente.query("BEGIN READ ONLY");
    const identidade = await consultarIdentidade(cliente);
    validarIdentidade(identidade);
    const catalogo = await consultarCatalogo(cliente);
    const fingerprintEstrutural = calcularFingerprintEstrutural(catalogo);
    const estrutura = validarEstrutura(catalogo, fingerprintEstrutural);
    const fingerprintDados = await calcularFingerprintDados(cliente);
    const existenciaRastreamento = await cliente.query<{ existe: boolean }>(`
      SELECT to_regclass('${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}') IS NOT NULL AS existe
    `);
    const existeRastreamento =
      existenciaRastreamento.rows[0]?.existe ?? false;
    const baseline = obterBaselineUnica();
    let quantidadeRastreamento = 0;
    let correspondeBaseline = false;

    if (existeRastreamento) {
      const rastreamento = await cliente.query<{
        quantidade: string;
        correto: boolean;
      }>(
        `
          SELECT
            count(*)::text AS quantidade,
            bool_and(hash = $1 AND created_at = $2) AS correto
          FROM ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}
        `,
        [baseline.hash, baseline.folderMillis],
      );
      quantidadeRastreamento = Number(
        rastreamento.rows[0]?.quantidade ?? "0",
      );
      correspondeBaseline =
        quantidadeRastreamento === 1 &&
        rastreamento.rows[0]?.correto === true;
    }
    await cliente.query("COMMIT");

    return {
      identidade,
      estrutura,
      fingerprintEstrutural,
      fingerprintDados,
      rastreamentoV2: {
        existe: existeRastreamento,
        quantidade: quantidadeRastreamento,
        correspondeBaseline,
      },
    };
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }
}

async function executarStamp(url: string) {
  const argumentoConfirmacao = process.argv.find((item) =>
    item.startsWith("--confirmar="),
  );
  const argumentoFingerprint = process.argv.find((item) =>
    item.startsWith("--fingerprint="),
  );

  if (
    argumentoConfirmacao?.slice("--confirmar=".length) !== CONFIRMACAO_EXIGIDA ||
    argumentoFingerprint?.slice("--fingerprint=".length) !==
      FINGERPRINT_ESTRUTURAL_ESPERADO
  ) {
    throw new Error("Confirmação explícita ou fingerprint esperado ausente.");
  }

  const baseline = obterBaselineUnica();
  const antes = await inspecionarSomenteLeitura(url);

  if (antes.rastreamentoV2.existe) {
    throw new Error("O rastreamento v2 já existe; stamp automático recusado.");
  }

  const cliente = new Client({ connectionString: url });
  await cliente.connect();

  try {
    await cliente.query("BEGIN");
    const identidade = await consultarIdentidade(cliente);
    validarIdentidade(identidade);
    const catalogoAntes = await consultarCatalogo(cliente);
    const estruturaAntes = calcularFingerprintEstrutural(catalogoAntes);
    validarEstrutura(catalogoAntes, estruturaAntes);
    const dadosAntes = await calcularFingerprintDados(cliente);

    if (
      estruturaAntes !== antes.fingerprintEstrutural ||
      dadosAntes !== antes.fingerprintDados
    ) {
      throw new Error("A production mudou entre a inspeção e o stamp.");
    }

    await cliente.query(`CREATE SCHEMA ${SCHEMA_MIGRACOES}`);
    await cliente.query(`
      CREATE TABLE ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES} (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);
    await cliente.query(
      `
        INSERT INTO ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES} (hash, created_at)
        VALUES ($1, $2)
      `,
      [baseline.hash, baseline.folderMillis],
    );

    const catalogoDepois = await consultarCatalogo(cliente);
    const estruturaDepois = calcularFingerprintEstrutural(catalogoDepois);
    const dadosDepois = await calcularFingerprintDados(cliente);
    validarEstrutura(catalogoDepois, estruturaDepois);

    if (
      estruturaAntes !== estruturaDepois ||
      dadosAntes !== dadosDepois
    ) {
      throw new Error("O stamp alteraria estrutura pública ou dados.");
    }

    const registro = await cliente.query<{
      quantidade: string;
      correto: boolean;
    }>(
      `
        SELECT
          count(*)::text AS quantidade,
          bool_and(hash = $1 AND created_at = $2) AS correto
        FROM ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}
      `,
      [baseline.hash, baseline.folderMillis],
    );

    if (
      registro.rows[0]?.quantidade !== "1" ||
      registro.rows[0]?.correto !== true
    ) {
      throw new Error("O registro do stamp não corresponde à baseline.");
    }

    await cliente.query("COMMIT");
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }

  const depois = await inspecionarSomenteLeitura(url);

  if (
    antes.fingerprintEstrutural !== depois.fingerprintEstrutural ||
    antes.fingerprintDados !== depois.fingerprintDados ||
    !depois.rastreamentoV2.correspondeBaseline
  ) {
    throw new Error("Validação posterior ao stamp falhou.");
  }

  console.log(
    JSON.stringify(
      {
        alvo: "production",
        stampAplicado: true,
        fingerprintEstrutural: depois.fingerprintEstrutural,
        fingerprintDadosAntes: antes.fingerprintDados,
        fingerprintDadosDepois: depois.fingerprintDados,
        tabelaOrfaPreservada: depois.estrutura.tabelaOrfaPresente,
      },
      null,
      2,
    ),
  );
}

async function executarMigratorNoOp(url: string) {
  const argumentoConfirmacao = process.argv.find((item) =>
    item.startsWith("--confirmar="),
  );
  const argumentoFingerprint = process.argv.find((item) =>
    item.startsWith("--fingerprint="),
  );

  if (
    argumentoConfirmacao?.slice("--confirmar=".length) !==
      CONFIRMACAO_NO_OP_EXIGIDA ||
    argumentoFingerprint?.slice("--fingerprint=".length) !==
      FINGERPRINT_ESTRUTURAL_ESPERADO
  ) {
    throw new Error("Confirmação explícita de no-op ou fingerprint ausente.");
  }

  // A inspeção exige identidade, estrutura e uma única baseline ativa.
  const antes = await inspecionarSomenteLeitura(url);

  if (!antes.rastreamentoV2.correspondeBaseline) {
    throw new Error("O rastreamento v2 não corresponde à baseline única.");
  }

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

  const depois = await inspecionarSomenteLeitura(url);

  if (
    antes.fingerprintEstrutural !== depois.fingerprintEstrutural ||
    antes.fingerprintDados !== depois.fingerprintDados ||
    !depois.rastreamentoV2.correspondeBaseline
  ) {
    throw new Error("O migrator não apresentou comportamento no-op.");
  }

  console.log(
    JSON.stringify(
      {
        alvo: "production",
        migratorNoOp: true,
        migrationsAtivas: 1,
        migrationsRegistradas: depois.rastreamentoV2.quantidade,
        fingerprintEstruturalAntes: antes.fingerprintEstrutural,
        fingerprintEstruturalDepois: depois.fingerprintEstrutural,
        fingerprintDadosAntes: antes.fingerprintDados,
        fingerprintDadosDepois: depois.fingerprintDados,
        tabelaOrfaPreservada: depois.estrutura.tabelaOrfaPresente,
      },
      null,
      2,
    ),
  );
}

function sanitizarMensagem(erro: unknown) {
  const mensagem =
    erro instanceof Error ? erro.message : "Falha desconhecida na preparação.";

  return mensagem
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[URL_REMOVIDA]")
    .replace(/(password|senha)=\S+/gi, "$1=[REMOVIDA]");
}

async function executar() {
  const url = carregarUrlPrincipal();
  const comando = process.argv[2];

  if (comando === "--inspecionar") {
    const resultado = await inspecionarSomenteLeitura(url);

    console.log(
      JSON.stringify(
        {
          alvo: "production",
          modo: "somente-leitura",
          identidadeConfirmada: true,
          banco: resultado.identidade.banco,
          projeto: resultado.identidade.projetoId,
          branch: resultado.identidade.branchId,
          endpoint: resultado.identidade.endpointId,
          estrutura: resultado.estrutura,
          fingerprintEstrutural: resultado.fingerprintEstrutural,
          fingerprintDados: resultado.fingerprintDados,
          rastreamentoV2: resultado.rastreamentoV2,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (comando === "--executar-stamp-production") {
    await executarStamp(url);
    return;
  }

  if (comando === "--validar-migrator-no-op-production") {
    await executarMigratorNoOp(url);
    return;
  }

  throw new Error(
    "Use --inspecionar, --executar-stamp-production ou --validar-migrator-no-op-production explicitamente.",
  );
}

executar().catch((erro) => {
  console.error(`[baseline-production] ${sanitizarMensagem(erro)}`);
  process.exit(1);
});
