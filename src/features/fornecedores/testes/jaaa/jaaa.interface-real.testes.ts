import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { subirPostgresDescartavel } from "../../../../../scripts/lib/postgres-docker-descartavel";
import { prepararFixtureJaaa } from "./fixture-jaaa";
import { validarInterfaceRealJaaa } from "./validar-interface-real";
async function testar() {
  const postgres = await subirPostgresDescartavel("nuu-etapa8-real-interface");
  let pool: Pool | undefined;
  try {
    const url = await postgres.criarBanco("jaaa_interface8");
    await postgres.confirmarIdentidade(url, "jaaa_interface8");
    pool = new Pool({ connectionString: url });
    await migrate(drizzle(pool), {
      migrationsFolder: "./drizzle",
      migrationsSchema: "drizzle_v2",
      migrationsTable: "__drizzle_migrations",
    });
    const f = await prepararFixtureJaaa(pool);
    await validarInterfaceRealJaaa({ pool, url, ...f });
  } finally {
    await pool?.end();
    await postgres.remover();
  }
}
testar().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
