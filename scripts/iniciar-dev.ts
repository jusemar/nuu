import { spawn } from "node:child_process";

import {
  consultarMigrationsLocais,
  descreverUrlSemSegredo,
  garantirPostgresLocal,
} from "./lib/postgres-local";

/**
 * Lançador do servidor de desenvolvimento.
 *
 *   npm run dev       → Next local + PostgreSQL LOCAL persistente (padrão seguro)
 *   npm run dev:neon  → recusado: localhost nunca utiliza Neon
 *
 * O lançador resolve e valida o PostgreSQL local antes de iniciar o Next. Nenhum
 * arquivo `.env*` é reescrito e nenhuma configuração remota é carregada.
 */

async function ambienteLocal() {
  const { url, versao } = await garantirPostgresLocal();
  const migrations = await consultarMigrationsLocais(url);
  console.log(
    `[dev] Banco: PostgreSQL LOCAL ${descreverUrlSemSegredo(url)} (PostgreSQL ${versao}).`,
  );
  if (migrations.aplicadas < migrations.noRepositorio) {
    console.warn(
      `[dev] ATENÇÃO: ${migrations.noRepositorio - migrations.aplicadas} migration(s) pendente(s) no banco local. Rode \`npm run migrations:local\`.`,
    );
  }
  const ambiente: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: url,
    NOOO_BANCO: "local",
  };
  return ambiente;
}

async function executar() {
  const [modo, ...argumentosNext] = process.argv.slice(2);
  if (modo === "neon") {
    throw new Error(
      "BLOQUEADO: o servidor localhost utiliza exclusivamente o PostgreSQL local. " +
        "Nenhuma configuração Neon foi carregada e nenhuma conexão foi iniciada.",
    );
  }
  if (modo !== "local") {
    throw new Error("Uso: tsx scripts/iniciar-dev.ts local");
  }
  const ambiente = await ambienteLocal();

  const processo = spawn(
    "bash",
    ["scripts/executar-next-com-lock.sh", "dev", ...argumentosNext],
    { stdio: "inherit", env: ambiente },
  );
  for (const sinal of ["SIGINT", "SIGTERM"] as const) {
    process.on(sinal, () => processo.kill(sinal));
  }
  processo.on("exit", (codigo, sinal) => {
    process.exit(codigo ?? (sinal ? 0 : 1));
  });
}

executar().catch((erro) => {
  console.error("[dev]", erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
