import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { subirPostgresDescartavel } from "../../../../../scripts/lib/postgres-docker-descartavel";
import { prepararFixturePainel } from "./fixture-painel";
import { validarInterfacePainel } from "./validar-interface-painel";
async function validar() {
  const postgres = await subirPostgresDescartavel("nuu-etapa7-interface");
  let pool: Pool | undefined;
  try {
    const url = await postgres.criarBanco("painel_interface7");
    await postgres.confirmarIdentidade(url, "painel_interface7");
    pool = new Pool({ connectionString: url });
    await migrate(drizzle(pool), {
      migrationsFolder: "./drizzle",
      migrationsSchema: "drizzle_v2",
      migrationsTable: "__drizzle_migrations",
    });
    await prepararFixturePainel(pool);
    await validarInterfacePainel({ pool, url });
  } finally {
    await pool?.end();
    await postgres.remover();
  }
}
validar().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
