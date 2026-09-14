import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";

import { parse } from "dotenv";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { Client } from "pg";

import { IMAGEM_POSTGRES_DESCARTAVEL } from "./postgres-docker-descartavel";

/**
 * PostgreSQL LOCAL PERSISTENTE da Nooo (desenvolvimento cotidiano).
 *
 * Existe UM único container, reutilizado por todas as sessões. Antes de criar
 * outro banco, use este. Bancos descartáveis (testes/migrations) ficam em
 * `postgres-docker-descartavel.ts` e nunca tocam este container.
 *
 * - container: nooo-postgres-local (reinicia sozinho: --restart unless-stopped)
 * - volume:    nooo-postgres-local-dados (os dados sobrevivem a stop/rm/reboot)
 * - porta:     127.0.0.1:55432 (nunca exposta fora da máquina)
 * - banco:     nooo_desenvolvimento / usuário nooo
 * - senha:     somente na DATABASE_URL de `.env.local` (não versionado)
 */
export const POSTGRES_LOCAL = {
  container: "nooo-postgres-local",
  volume: "nooo-postgres-local-dados",
  host: "127.0.0.1",
  porta: 55432,
  banco: "nooo_desenvolvimento",
  usuario: "nooo",
  imagem: IMAGEM_POSTGRES_DESCARTAVEL,
  rotulo: "nooo.postgres-local",
} as const;

export const ARQUIVO_ENV_LOCAL = ".env.local";

const executarComando = promisify(execFile);

async function docker(argumentos: string[]) {
  const { stdout } = await executarComando("docker", argumentos);
  return stdout.trim();
}

/** Host de loopback: única forma aceita para o banco de desenvolvimento. */
export function ehHostLoopback(host: string) {
  return ["127.0.0.1", "localhost", "[::1]", "::1"].includes(host);
}

/**
 * Regra pura: a URL precisa ser exatamente a do container persistente.
 * Qualquer outra (Neon, outra porta, outro banco) é recusada.
 */
export function validarUrlPostgresLocal(url: string) {
  let destino: URL;
  try {
    destino = new URL(url);
  } catch {
    throw new Error(`DATABASE_URL inválida em ${ARQUIVO_ENV_LOCAL}.`);
  }
  if (
    !ehHostLoopback(destino.hostname) ||
    Number(destino.port) !== POSTGRES_LOCAL.porta ||
    destino.pathname !== `/${POSTGRES_LOCAL.banco}` ||
    decodeURIComponent(destino.username) !== POSTGRES_LOCAL.usuario ||
    !destino.password
  ) {
    throw new Error(
      `DATABASE_URL de ${ARQUIVO_ENV_LOCAL} não aponta para o PostgreSQL local ` +
        `(${POSTGRES_LOCAL.usuario}@${POSTGRES_LOCAL.host}:${POSTGRES_LOCAL.porta}/${POSTGRES_LOCAL.banco}). ` +
        "Veja docs/ambientes-banco-e-scripts.md.",
    );
  }
  return destino;
}

/** Lê a URL local de `.env.local` sem carregar nada no ambiente do processo. */
export function lerUrlPostgresLocal() {
  let conteudo: Buffer;
  try {
    conteudo = readFileSync(ARQUIVO_ENV_LOCAL);
  } catch {
    throw new Error(
      `${ARQUIVO_ENV_LOCAL} não encontrado. Veja docs/ambientes-banco-e-scripts.md.`,
    );
  }
  const url = parse(conteudo).DATABASE_URL?.trim() ?? "";
  validarUrlPostgresLocal(url);
  return url;
}

/** Texto seguro para log: nunca mostra a senha. */
export function descreverUrlSemSegredo(url: string) {
  const destino = new URL(url);
  return `${destino.hostname}:${destino.port}${destino.pathname}`;
}

export type EstadoContainerLocal = "ausente" | "parado" | "rodando";

export async function consultarEstadoContainerLocal(): Promise<EstadoContainerLocal> {
  const estado = await docker([
    "inspect",
    "--format",
    "{{.State.Running}}",
    POSTGRES_LOCAL.container,
  ]).catch(() => null);
  if (estado === null) return "ausente";
  return estado === "true" ? "rodando" : "parado";
}

async function confirmarIdentidade(url: string) {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  try {
    const resultado = await cliente.query<{
      cluster: string;
      banco: string;
      versao: string;
    }>(
      "SELECT current_setting('cluster_name') AS cluster, current_database() AS banco, current_setting('server_version') AS versao",
    );
    const linha = resultado.rows[0];
    if (
      linha?.cluster !== POSTGRES_LOCAL.container ||
      linha.banco !== POSTGRES_LOCAL.banco
    ) {
      throw new Error(
        "O servidor em 127.0.0.1:55432 não é o PostgreSQL local da Nooo.",
      );
    }
    return linha.versao;
  } finally {
    await cliente.end();
  }
}

function pausar(milissegundos: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milissegundos));
}

/**
 * Garante o container rodando (cria na primeira vez, inicia se parado) e
 * confirma a identidade do servidor. Nunca cria uma segunda instância.
 */
export async function garantirPostgresLocal() {
  const url = lerUrlPostgresLocal();
  const estado = await consultarEstadoContainerLocal();

  if (estado === "ausente") {
    const senha = decodeURIComponent(new URL(url).password);
    console.log(
      `[postgres-local] Criando ${POSTGRES_LOCAL.container} (volume ${POSTGRES_LOCAL.volume}).`,
    );
    await docker([
      "run",
      "-d",
      "--name",
      POSTGRES_LOCAL.container,
      "--restart",
      "unless-stopped",
      "--label",
      `${POSTGRES_LOCAL.rotulo}=persistente`,
      "-e",
      `POSTGRES_USER=${POSTGRES_LOCAL.usuario}`,
      "-e",
      `POSTGRES_PASSWORD=${senha}`,
      "-e",
      `POSTGRES_DB=${POSTGRES_LOCAL.banco}`,
      "-v",
      `${POSTGRES_LOCAL.volume}:/var/lib/postgresql/data`,
      "-p",
      `${POSTGRES_LOCAL.host}:${POSTGRES_LOCAL.porta}:5432`,
      POSTGRES_LOCAL.imagem,
      "-c",
      `cluster_name=${POSTGRES_LOCAL.container}`,
    ]);
  } else if (estado === "parado") {
    console.log(`[postgres-local] Iniciando ${POSTGRES_LOCAL.container}.`);
    await docker(["start", POSTGRES_LOCAL.container]);
  }

  const limite = Date.now() + 90_000;
  for (;;) {
    try {
      const versao = await confirmarIdentidade(url);
      return { url, versao };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      if (mensagem.includes("não é o PostgreSQL local")) throw erro;
      if (Date.now() > limite) {
        throw new Error(`PostgreSQL local indisponível: ${mensagem}`);
      }
      await pausar(500);
    }
  }
}

export async function pararPostgresLocal() {
  if ((await consultarEstadoContainerLocal()) === "rodando") {
    await docker(["stop", POSTGRES_LOCAL.container]);
  }
}

/** Situação das migrations do banco local em relação aos arquivos do repositório. */
export async function consultarMigrationsLocais(url: string) {
  const locais = readMigrationFiles({ migrationsFolder: "./drizzle" });
  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  try {
    const existe = await cliente.query<{ tabela: string | null }>(
      "SELECT to_regclass('drizzle_v2.__drizzle_migrations')::text AS tabela",
    );
    const aplicadas = existe.rows[0]?.tabela
      ? ((
          await cliente.query<{ total: number }>(
            "SELECT count(*)::int AS total FROM drizzle_v2.__drizzle_migrations",
          )
        ).rows[0]?.total ?? 0)
      : 0;
    return { aplicadas, noRepositorio: locais.length };
  } finally {
    await cliente.end();
  }
}
