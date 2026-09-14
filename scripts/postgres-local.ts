import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  consultarEstadoContainerLocal,
  consultarMigrationsLocais,
  descreverUrlSemSegredo,
  garantirPostgresLocal,
  pararPostgresLocal,
  POSTGRES_LOCAL,
} from "./lib/postgres-local";

/**
 * Gerencia o PostgreSQL local persistente da Nooo.
 *
 *   npm run db:local:subir   → cria (1ª vez) ou inicia o container
 *   npm run db:local:parar   → para o container (dados ficam no volume)
 *   npm run db:local:status  → estado, versão, pgvector e migrations
 */
const executarComando = promisify(execFile);

async function status() {
  const estado = await consultarEstadoContainerLocal();
  console.log(`container : ${POSTGRES_LOCAL.container} (${estado})`);
  console.log(`volume    : ${POSTGRES_LOCAL.volume}`);
  console.log(`porta     : ${POSTGRES_LOCAL.host}:${POSTGRES_LOCAL.porta}`);
  if (estado !== "rodando") {
    console.log("Use `npm run db:local:subir` para iniciar.");
    return;
  }
  const { url, versao } = await garantirPostgresLocal();
  const { stdout } = await executarComando("docker", [
    "exec",
    POSTGRES_LOCAL.container,
    "psql",
    "-U",
    POSTGRES_LOCAL.usuario,
    "-d",
    POSTGRES_LOCAL.banco,
    "-tAc",
    "SELECT coalesce((SELECT extversion FROM pg_extension WHERE extname = 'vector'), (SELECT 'disponível ' || default_version FROM pg_available_extensions WHERE name = 'vector'), 'ausente')",
  ]);
  const migrations = await consultarMigrationsLocais(url);
  console.log(`destino   : ${descreverUrlSemSegredo(url)}`);
  console.log(`postgres  : ${versao}`);
  console.log(`pgvector  : ${stdout.trim()}`);
  console.log(
    `migrations: ${migrations.aplicadas}/${migrations.noRepositorio} aplicadas`,
  );
}

async function executar() {
  const acao = process.argv[2];
  if (acao === "subir") {
    const { url, versao } = await garantirPostgresLocal();
    console.log(
      `[postgres-local] Pronto em ${descreverUrlSemSegredo(url)} (PostgreSQL ${versao}).`,
    );
  } else if (acao === "parar") {
    await pararPostgresLocal();
    console.log(
      `[postgres-local] ${POSTGRES_LOCAL.container} parado. Dados preservados no volume ${POSTGRES_LOCAL.volume}.`,
    );
  } else if (acao === "status") {
    await status();
  } else {
    throw new Error("Uso: tsx scripts/postgres-local.ts <subir|parar|status>");
  }
}

executar().catch((erro) => {
  console.error(
    "[postgres-local]",
    erro instanceof Error ? erro.message : "Erro desconhecido",
  );
  process.exit(1);
});
