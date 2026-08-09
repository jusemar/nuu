import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import {
  encerrarComFalhaDeDestino,
  exigirBancoLocal,
} from "./lib/guarda-banco-local";

/**
 * Aplica as migrations pendentes SOMENTE na branch de desenvolvimento.
 *
 * A guarda roda antes de qualquer conexão e recusa qualquer endpoint que não
 * seja o de desenvolvimento — inclusive o de produção, que tem caminho próprio
 * (`scripts/aplicar-migration-producao.ts`) e exige autorização explícita.
 *
 * Uso: `npm run migrations:desenvolvimento`
 */
async function executar() {
  const destino = await exigirBancoLocal(["desenvolvimento"]);

  const pool = new Pool({ connectionString: destino.url });
  const db = drizzle(pool);

  const antes = await pool.query<{ total: number }>(
    "select count(*)::int as total from drizzle_v2.__drizzle_migrations",
  );

  await migrate(db, {
    migrationsFolder: "./drizzle",
    migrationsSchema: "drizzle_v2",
    migrationsTable: "__drizzle_migrations",
  });

  const depois = await pool.query<{ total: number }>(
    "select count(*)::int as total from drizzle_v2.__drizzle_migrations",
  );

  console.log(
    `\n[migrations] ${antes.rows[0]?.total ?? 0} -> ${depois.rows[0]?.total ?? 0} registros em drizzle_v2.__drizzle_migrations.`,
  );

  await pool.end();
}

executar().catch(encerrarComFalhaDeDestino);
