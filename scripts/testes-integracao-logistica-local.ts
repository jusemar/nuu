import { spawn } from "node:child_process";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import {
  type PostgresDescartavel,
  subirPostgresDescartavel,
} from "./lib/postgres-docker-descartavel";

/**
 * Testes de integração da logística (Frete Externo + Entrega Própria por
 * Categoria) em PostgreSQL LOCAL descartável:
 * 1. sobe um container Docker só em 127.0.0.1;
 * 2. aplica a cadeia completa de migrations (0 → última);
 * 3. roda os testes com DATABASE_URL apontando para esse banco;
 * 4. remove o container, com sucesso ou falha.
 *
 * Nenhuma variável de produção é carregada: os segredos externos recebem
 * valores de fixture e a rede externa é bloqueada dentro dos testes.
 */

const PREFIXO = "nuu-testes-logistica";
const BANCO = "logistica_integracao";
const ARQUIVOS_TESTE = [
  "src/features/logistica/testes/integracao-local/heranca-frete-entrega-propria.integracao-local.testes.ts",
];

async function aplicarMigrations(url: string) {
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), {
      migrationsFolder: "./drizzle",
      migrationsSchema: "drizzle_v2",
      migrationsTable: "__drizzle_migrations",
    });
  } finally {
    await pool.end();
  }
}

function rodarTestes(url: string) {
  return new Promise<number>((resolve) => {
    const processo = spawn(
      "npx",
      ["tsx", "--tsconfig", "tsconfig.json", "--test", ...ARQUIVOS_TESTE],
      {
        stdio: "inherit",
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          NODE_OPTIONS: "--conditions=react-server",
          NODE_ENV: "test",
          DATABASE_URL: url,
          DATABASE_URL_INTEGRACAO_LOGISTICA: url,
          APP_ENVIRONMENT: "homologacao",
          // Valores de fixture: módulos de autenticação exigem as variáveis.
          BETTER_AUTH_URL: "http://127.0.0.1:3000",
          BETTER_AUTH_SECRET: "segredo-fixture-integracao-local-0123456789",
          GOOGLE_CLIENT_ID: "fixture",
          GOOGLE_CLIENT_SECRET: "fixture",
        },
      },
    );
    processo.on("exit", (codigo) => resolve(codigo ?? 1));
  });
}

async function executar() {
  let postgres: PostgresDescartavel | null = null;
  try {
    postgres = await subirPostgresDescartavel(PREFIXO);
    console.log(`[integração-logística] PostgreSQL local: ${postgres.nome}`);
    const url = await postgres.criarBanco(BANCO);
    await postgres.confirmarIdentidade(url, BANCO);
    await aplicarMigrations(url);
    console.log("[integração-logística] Migrations aplicadas (0 → última).");
    process.exitCode = await rodarTestes(url);
  } catch (erro) {
    console.error(
      "[integração-logística] Falha:",
      erro instanceof Error ? erro.message : erro,
    );
    process.exitCode = 1;
  } finally {
    await postgres?.remover();
    if (postgres) {
      console.log(
        `[integração-logística] Container removido: ${postgres.nome}`,
      );
    }
  }
}

void executar();
