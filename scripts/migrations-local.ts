import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import {
  consultarMigrationsLocais,
  descreverUrlSemSegredo,
  garantirPostgresLocal,
} from "./lib/postgres-local";

/**
 * `npm run migrations:local` — aplica as migrations pendentes no PostgreSQL
 * LOCAL persistente (o banco do `npm run dev`). Pode ser repetido à vontade.
 *
 * Nunca acessa a Neon: a URL vem de `.env.local` e precisa ser exatamente a do
 * container `nooo-postgres-local`, com identidade conferida no servidor.
 */
async function executar() {
  const { url } = await garantirPostgresLocal();
  const antes = await consultarMigrationsLocais(url);
  console.log(
    `[migrations:local] ${descreverUrlSemSegredo(url)} — antes: ${antes.aplicadas}/${antes.noRepositorio}.`,
  );

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

  const depois = await consultarMigrationsLocais(url);
  if (depois.aplicadas !== depois.noRepositorio) {
    throw new Error(
      `Banco local ficou com ${depois.aplicadas}/${depois.noRepositorio} migrations.`,
    );
  }
  console.log(
    `[migrations:local] depois: ${depois.aplicadas}/${depois.noRepositorio}.`,
  );
}

executar().catch((erro) => {
  console.error(
    "[migrations:local]",
    erro instanceof Error ? erro.message : "Erro desconhecido",
  );
  process.exit(1);
});
