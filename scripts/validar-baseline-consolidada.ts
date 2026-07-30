import { readFileSync } from "node:fs";

import { parse } from "dotenv";
import { Client } from "pg";

type ColunaSnapshot = {
  name: string;
  type: string;
  primaryKey: boolean;
  notNull: boolean;
  default?: unknown;
};

type ObjetoNomeado = {
  name: string;
};

type TabelaSnapshot = {
  name: string;
  columns: Record<string, ColunaSnapshot>;
  indexes: Record<string, ObjetoNomeado>;
  foreignKeys: Record<string, ObjetoNomeado>;
  uniqueConstraints: Record<string, ObjetoNomeado>;
  checkConstraints: Record<string, ObjetoNomeado>;
};

type EnumSnapshot = {
  name: string;
  values: string[];
};

type Snapshot = {
  tables: Record<string, TabelaSnapshot>;
  enums: Record<string, EnumSnapshot>;
};

const ENDPOINT_VAZIO = "ep-calm-sunset-acbm8l2l";
const BANCO_VAZIO = "baseline_vazio";
const TABELA_ORFA = "diagnosticos_cotacoes_frete_paralelas";

function carregarUrl() {
  const ambiente = parse(readFileSync(".env.baseline-vazio.local"));

  if (ambiente.BASELINE_VAZIO_DESCARTAVEL !== "SIM") {
    throw new Error("O alvo não está marcado como descartável.");
  }

  const urlTexto = ambiente.DATABASE_URL_BASELINE_VAZIO?.trim();

  if (!urlTexto) {
    throw new Error("DATABASE_URL_BASELINE_VAZIO não configurada.");
  }

  const url = new URL(urlTexto);
  const endpoint = url.hostname.split(".")[0]?.replace(/-pooler$/, "");

  if (
    endpoint !== ENDPOINT_VAZIO ||
    url.pathname.replace(/^\//, "") !== BANCO_VAZIO
  ) {
    throw new Error("Identidade local do banco vazio inesperada.");
  }

  return urlTexto;
}

function carregarSnapshot(): Snapshot {
  return JSON.parse(
    readFileSync("drizzle/meta/0000_snapshot.json", "utf8"),
  ) as Snapshot;
}

function ordenar(valores: Iterable<string>) {
  return [...valores].sort();
}

function diferenca(esperados: string[], atuais: string[]) {
  return esperados.filter((valor) => !atuais.includes(valor));
}

function normalizarIdentificadorPostgres(valor: string) {
  // PostgreSQL limita identificadores a 63 bytes. Os nomes atuais usam apenas
  // ASCII, portanto o corte por caracteres reproduz o nome persistido.
  return valor.slice(0, 63);
}

async function executar() {
  const url = carregarUrl();
  const snapshot = carregarSnapshot();
  const cliente = new Client({ connectionString: url });
  await cliente.connect();

  try {
    await cliente.query("BEGIN READ ONLY");
    const identidade = await cliente.query<{
      banco: string;
      endpoint_id: string | null;
    }>(`
      SELECT
        current_database() AS banco,
        current_setting('neon.endpoint_id', true) AS endpoint_id
    `);
    const linhaIdentidade = identidade.rows[0];

    if (
      linhaIdentidade?.banco !== BANCO_VAZIO ||
      linhaIdentidade.endpoint_id !== ENDPOINT_VAZIO
    ) {
      throw new Error("A sessão não corresponde ao banco vazio descartável.");
    }

    const [tabelas, colunas, restricoes, indices, enums, sequencias] =
      await Promise.all([
        cliente.query<{ tabela: string }>(`
          SELECT tablename AS tabela
          FROM pg_catalog.pg_tables
          WHERE schemaname = 'public'
          ORDER BY tablename
        `),
        cliente.query<{
          tabela: string;
          coluna: string;
          aceita_nulo: string;
          valor_padrao: string | null;
        }>(`
          SELECT
            table_name AS tabela,
            column_name AS coluna,
            is_nullable AS aceita_nulo,
            column_default AS valor_padrao
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position
        `),
        cliente.query<{
          tabela: string;
          nome: string;
          tipo: string;
        }>(`
          SELECT
            tabela.relname AS tabela,
            restricao.conname AS nome,
            restricao.contype::text AS tipo
          FROM pg_catalog.pg_constraint restricao
          JOIN pg_catalog.pg_class tabela ON tabela.oid = restricao.conrelid
          JOIN pg_catalog.pg_namespace namespace ON namespace.oid = tabela.relnamespace
          WHERE namespace.nspname = 'public'
          ORDER BY tabela.relname, restricao.conname
        `),
        cliente.query<{ nome: string }>(`
          SELECT indexname AS nome
          FROM pg_catalog.pg_indexes
          WHERE schemaname = 'public'
          ORDER BY indexname
        `),
        cliente.query<{ nome: string; valor: string }>(`
          SELECT tipo.typname AS nome, enum.enumlabel AS valor
          FROM pg_catalog.pg_type tipo
          JOIN pg_catalog.pg_enum enum ON enum.enumtypid = tipo.oid
          JOIN pg_catalog.pg_namespace namespace ON namespace.oid = tipo.typnamespace
          WHERE namespace.nspname = 'public'
          ORDER BY tipo.typname, enum.enumsortorder
        `),
        cliente.query<{ nome: string }>(`
          SELECT sequence_name AS nome
          FROM information_schema.sequences
          WHERE sequence_schema = 'public'
          ORDER BY sequence_name
        `),
      ]);

    const tabelasEsperadas = ordenar(
      Object.values(snapshot.tables).map((tabela) => tabela.name),
    );
    const tabelasAtuais = tabelas.rows.map((linha) => linha.tabela);
    const colunasEsperadas = ordenar(
      Object.values(snapshot.tables).flatMap((tabela) =>
        Object.values(tabela.columns).map(
          (coluna) => `${tabela.name}.${coluna.name}`,
        ),
      ),
    );
    const colunasAtuais = ordenar(
      colunas.rows.map((linha) => `${linha.tabela}.${linha.coluna}`),
    );
    const chavesEstrangeirasEsperadas = ordenar(
      Object.values(snapshot.tables).flatMap((tabela) =>
        Object.values(tabela.foreignKeys).map((objeto) =>
          normalizarIdentificadorPostgres(objeto.name),
        ),
      ),
    );
    const chavesEstrangeirasAtuais = ordenar(
      restricoes.rows
        .filter((linha) => linha.tipo === "f")
        .map((linha) => linha.nome),
    );
    const checksEsperados = ordenar(
      Object.values(snapshot.tables).flatMap((tabela) =>
        Object.values(tabela.checkConstraints).map((objeto) => objeto.name),
      ),
    );
    const checksAtuais = ordenar(
      restricoes.rows
        .filter((linha) => linha.tipo === "c")
        .map((linha) => linha.nome),
    );
    const indicesEsperados = ordenar(
      Object.values(snapshot.tables).flatMap((tabela) =>
        Object.values(tabela.indexes).map((objeto) => objeto.name),
      ),
    );
    const indicesAtuais = indices.rows.map((linha) => linha.nome);
    const enumsEsperados = ordenar(
      Object.values(snapshot.enums).flatMap((item) =>
        item.values.map((valor) => `${item.name}.${valor}`),
      ),
    );
    const enumsAtuais = ordenar(
      enums.rows.map((linha) => `${linha.nome}.${linha.valor}`),
    );
    const defaultsEsperados = ordenar(
      Object.values(snapshot.tables).flatMap((tabela) =>
        Object.values(tabela.columns)
          .filter((coluna) => coluna.default !== undefined)
          .map((coluna) => `${tabela.name}.${coluna.name}`),
      ),
    );
    const defaultsAtuais = ordenar(
      colunas.rows
        .filter((linha) => linha.valor_padrao !== null)
        .map((linha) => `${linha.tabela}.${linha.coluna}`),
    );
    const notNullEsperados = ordenar(
      Object.values(snapshot.tables).flatMap((tabela) =>
        Object.values(tabela.columns)
          .filter((coluna) => coluna.notNull)
          .map((coluna) => `${tabela.name}.${coluna.name}`),
      ),
    );
    const notNullAtuais = ordenar(
      colunas.rows
        .filter((linha) => linha.aceita_nulo === "NO")
        .map((linha) => `${linha.tabela}.${linha.coluna}`),
    );
    const sequenciasEsperadas = Object.values(snapshot.tables).flatMap(
      (tabela) =>
        Object.values(tabela.columns).filter((coluna) =>
          ["bigserial", "serial", "smallserial"].includes(coluna.type),
        ),
    ).length;
    const divergencias = {
      tabelasAusentes: diferenca(tabelasEsperadas, tabelasAtuais),
      tabelasExtras: diferenca(tabelasAtuais, tabelasEsperadas),
      colunasAusentes: diferenca(colunasEsperadas, colunasAtuais),
      colunasExtras: diferenca(colunasAtuais, colunasEsperadas),
      chavesEstrangeirasAusentes: diferenca(
        chavesEstrangeirasEsperadas,
        chavesEstrangeirasAtuais,
      ),
      checksAusentes: diferenca(checksEsperados, checksAtuais),
      indicesAusentes: diferenca(indicesEsperados, indicesAtuais),
      enumsAusentes: diferenca(enumsEsperados, enumsAtuais),
      enumsExtras: diferenca(enumsAtuais, enumsEsperados),
      defaultsAusentes: diferenca(defaultsEsperados, defaultsAtuais),
      notNullAusentes: diferenca(notNullEsperados, notNullAtuais),
    };
    const possuiDivergencia = Object.values(divergencias).some(
      (itens) => itens.length > 0,
    );

    if (
      possuiDivergencia ||
      tabelasAtuais.includes(TABELA_ORFA) ||
      sequencias.rows.length !== sequenciasEsperadas
    ) {
      throw new Error(
        `Baseline divergente: ${JSON.stringify({
          divergencias,
          tabelaOrfaCriada: tabelasAtuais.includes(TABELA_ORFA),
          sequenciasEsperadas,
          sequenciasAtuais: sequencias.rows.length,
        })}`,
      );
    }

    await cliente.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          compativelComSnapshot: true,
          tabelas: tabelasAtuais.length,
          colunas: colunasAtuais.length,
          enums: Object.keys(snapshot.enums).length,
          valoresEnum: enumsAtuais.length,
          indicesDeclarados: indicesEsperados.length,
          indicesTotaisNoBanco: indicesAtuais.length,
          chavesEstrangeiras: chavesEstrangeirasAtuais.length,
          checks: checksAtuais.length,
          defaults: defaultsAtuais.length,
          colunasNotNull: notNullAtuais.length,
          sequencias: sequencias.rows.length,
          tabelaOrfaCriada: false,
          divergencias,
        },
        null,
        2,
      ),
    );
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }
}

executar().catch((erro) => {
  const mensagem =
    erro instanceof Error ? erro.message : "Falha desconhecida na validação.";
  console.error(`[validar-baseline] ${mensagem}`);
  process.exit(1);
});
