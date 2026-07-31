import "dotenv/config";

import { defineConfig } from "drizzle-kit";

const urlMigracoesSeguras =
  process.env.DATABASE_URL_MIGRACOES ??
  process.env.DATABASE_URL_BASELINE_VAZIO ??
  process.env.DATABASE_URL_BASELINE_CLONE;

if (!urlMigracoesSeguras) {
  throw new Error(
    "Informe uma conexão descartável explícita para operações do Drizzle.",
  );
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  strict: true,
  verbose: true,
  migrations: {
    schema: "drizzle_v2",
    table: "__drizzle_migrations",
  },
  dbCredentials: {
    url: urlMigracoesSeguras,
  },
});
