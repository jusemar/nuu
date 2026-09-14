import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

import { parse } from "dotenv";

import {
  consultarMigrationsLocais,
  descreverUrlSemSegredo,
  garantirPostgresLocal,
} from "./lib/postgres-local";

/**
 * Lançador do servidor de desenvolvimento.
 *
 *   npm run dev       → Next local + PostgreSQL LOCAL persistente (padrão seguro)
 *   npm run dev:neon  → Next local + Neon, somente neste processo
 *
 * A escolha vale apenas para o processo iniciado: nenhum arquivo `.env*` é
 * reescrito. O Next.js não sobrescreve variáveis já presentes no ambiente, então
 * DATABASE_URL (e APP_ENVIRONMENT no modo Neon) definidos aqui vencem `.env.local`.
 * Ao encerrar `dev:neon`, o próximo `npm run dev` volta ao banco local.
 */

const ARQUIVO_NEON = ".env.dev-neon.local";

function descreverHost(url: string) {
  return new URL(url).hostname;
}

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
  // Nunca herda a marca do modo Neon (ex.: terminal reaproveitado).
  const ambiente: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: url,
    NOOO_BANCO: "local",
  };
  delete ambiente.NOOO_BANCO_NEON_EXPLICITO;
  return ambiente;
}

function ambienteNeon() {
  let variaveis: Record<string, string>;
  try {
    variaveis = parse(readFileSync(ARQUIVO_NEON));
  } catch {
    throw new Error(
      `${ARQUIVO_NEON} não encontrado. Veja docs/ambientes-banco-e-scripts.md.`,
    );
  }
  const url = variaveis.DATABASE_URL?.trim() ?? "";
  let host = "";
  try {
    host = descreverHost(url);
  } catch {
    throw new Error(`DATABASE_URL inválida em ${ARQUIVO_NEON}.`);
  }
  if (!host.endsWith(".neon.tech")) {
    throw new Error(`${ARQUIVO_NEON} precisa apontar para um endpoint Neon.`);
  }
  // Nenhuma conexão é aberta aqui: a Neon só é acessada pela aplicação.
  console.warn("┌──────────────────────────────────────────────────────────");
  console.warn("│ [dev:neon] APLICAÇÃO LOCAL + BANCO NEON (explícito)");
  console.warn(`│ host: ${host}`);
  console.warn(
    `│ APP_ENVIRONMENT: ${variaveis.APP_ENVIRONMENT ?? "(de .env.local)"}`,
  );
  console.warn("│ Consome compute da Neon. Encerre com Ctrl+C.");
  console.warn("└──────────────────────────────────────────────────────────");
  return {
    ...process.env,
    DATABASE_URL: url,
    ...(variaveis.APP_ENVIRONMENT
      ? { APP_ENVIRONMENT: variaveis.APP_ENVIRONMENT }
      : {}),
    NOOO_BANCO: "neon",
    NOOO_BANCO_NEON_EXPLICITO: "sim",
  };
}

async function executar() {
  const [modo, ...argumentosNext] = process.argv.slice(2);
  if (modo !== "local" && modo !== "neon") {
    throw new Error("Uso: tsx scripts/iniciar-dev.ts <local|neon>");
  }
  const ambiente = modo === "neon" ? ambienteNeon() : await ambienteLocal();

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
