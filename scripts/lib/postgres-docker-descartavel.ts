import { execFile } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { Client } from "pg";

/**
 * PostgreSQL descartável em Docker para validar migrations e rodar testes de
 * integração SEM criar recursos na Neon.
 *
 * Garantias:
 * - o container escuta só em 127.0.0.1, numa porta aleatória;
 * - o `cluster_name` do servidor recebe o nome único da execução, e toda
 *   escrita confere essa identidade antes de acontecer (nunca cai na Neon);
 * - a remoção só atinge o container criado por esta execução (nome + rótulo).
 */

const executarComando = promisify(execFile);

/** Mesmo major da produção (Neon PG 17) e com pgvector, exigido pelas migrations. */
export const IMAGEM_POSTGRES_DESCARTAVEL = "pgvector/pgvector:pg17";
export const ROTULO_POSTGRES_DESCARTAVEL = "nuu.postgres-descartavel";
const USUARIO = "postgres";

export type IdentidadePostgresLocal = {
  host: string;
  banco: string;
  clusterName: string;
};

export type PostgresDescartavel = {
  nome: string;
  porta: number;
  /** URL para um banco deste container. */
  url: (banco: string) => string;
  criarBanco: (banco: string) => Promise<string>;
  /** Confere que a URL fala com ESTE container antes de qualquer escrita. */
  confirmarIdentidade: (url: string, banco: string) => Promise<void>;
  remover: () => Promise<void>;
};

/** Nome único e reconhecível (usado também como `cluster_name`). */
export function montarNomePostgresDescartavel(prefixo: string) {
  if (!/^[a-z0-9-]{3,40}$/.test(prefixo)) {
    throw new Error("Prefixo de container inválido.");
  }
  const carimbo = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `${prefixo}-${carimbo}-${randomUUID().slice(0, 8)}`;
}

/** Regra pura: a conexão precisa ser loopback, no banco e cluster esperados. */
export function validarIdentidadePostgresLocal(
  identidade: IdentidadePostgresLocal,
  esperado: { banco: string; clusterName: string },
) {
  if (!["127.0.0.1", "localhost"].includes(identidade.host)) {
    throw new Error("A conexão não aponta para o PostgreSQL local.");
  }
  if (identidade.clusterName !== esperado.clusterName) {
    throw new Error("O servidor não é o container desta execução.");
  }
  if (identidade.banco !== esperado.banco) {
    throw new Error("A conexão não aponta para o banco esperado.");
  }
}

/** Nome de banco seguro para CREATE DATABASE (sem aspas nem injeção). */
export function validarNomeBanco(banco: string) {
  if (!/^[a-z][a-z0-9_]{2,40}$/.test(banco)) {
    throw new Error(`Nome de banco inválido: ${banco}`);
  }
  return banco;
}

function pausar(milissegundos: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milissegundos));
}

async function docker(argumentos: string[]) {
  const { stdout } = await executarComando("docker", argumentos, {
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

async function consultarIdentidade(
  url: string,
): Promise<IdentidadePostgresLocal> {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  try {
    const resultado = await cliente.query<{
      banco: string;
      cluster_name: string;
    }>(
      "SELECT current_database() AS banco, current_setting('cluster_name') AS cluster_name",
    );
    return {
      host: new URL(url).hostname,
      banco: resultado.rows[0]?.banco ?? "",
      clusterName: resultado.rows[0]?.cluster_name ?? "",
    };
  } finally {
    await cliente.end();
  }
}

/** Sobe o container, espera aceitar conexões e devolve os utilitários. */
export async function subirPostgresDescartavel(
  prefixo: string,
): Promise<PostgresDescartavel> {
  const nome = montarNomePostgresDescartavel(prefixo);
  const senha = randomBytes(18).toString("hex");

  await docker([
    "run",
    "-d",
    "--rm",
    "--name",
    nome,
    "--label",
    `${ROTULO_POSTGRES_DESCARTAVEL}=${nome}`,
    "-e",
    `POSTGRES_PASSWORD=${senha}`,
    "-p",
    "127.0.0.1::5432",
    IMAGEM_POSTGRES_DESCARTAVEL,
    "-c",
    `cluster_name=${nome}`,
    // Banco descartável: durabilidade desligada acelera a validação.
    "-c",
    "fsync=off",
    "-c",
    "synchronous_commit=off",
    "-c",
    "full_page_writes=off",
  ]);

  const remover = async () => {
    // Só remove o container desta execução (nome e rótulo conferidos).
    const rotulo = await docker([
      "inspect",
      "--format",
      `{{ index .Config.Labels "${ROTULO_POSTGRES_DESCARTAVEL}" }}`,
      nome,
    ]).catch(() => "");
    // `-v` remove também o volume anônimo de dados (senão sobra no Docker).
    if (rotulo === nome) await docker(["rm", "-f", "-v", nome]);
  };

  try {
    const mapeamento = await docker(["port", nome, "5432/tcp"]);
    const porta = Number(mapeamento.split("\n")[0]?.split(":").at(-1));
    if (!Number.isInteger(porta) || porta <= 0) {
      throw new Error("O Docker não publicou a porta do PostgreSQL.");
    }
    const url = (banco: string) =>
      `postgresql://${USUARIO}:${senha}@127.0.0.1:${porta}/${validarNomeBanco(banco)}`;

    const confirmarIdentidade = async (urlBanco: string, banco: string) => {
      validarIdentidadePostgresLocal(await consultarIdentidade(urlBanco), {
        banco,
        clusterName: nome,
      });
    };

    // A imagem inicializa o cluster e reinicia; só o servidor final aceita TCP.
    const limite = Date.now() + 90_000;
    let ultimaFalha = "sem resposta";
    for (;;) {
      try {
        await confirmarIdentidade(url("postgres"), "postgres");
        break;
      } catch (erro) {
        ultimaFalha = erro instanceof Error ? erro.message : ultimaFalha;
        if (Date.now() > limite) {
          throw new Error(`PostgreSQL local indisponível: ${ultimaFalha}`);
        }
        await pausar(500);
      }
    }

    const criarBanco = async (banco: string) => {
      const cliente = new Client({ connectionString: url("postgres") });
      await cliente.connect();
      try {
        await cliente.query(`CREATE DATABASE ${validarNomeBanco(banco)}`);
      } finally {
        await cliente.end();
      }
      const urlBanco = url(banco);
      await confirmarIdentidade(urlBanco, banco);
      return urlBanco;
    };

    return { nome, porta, url, criarBanco, confirmarIdentidade, remover };
  } catch (erro) {
    await remover().catch(() => undefined);
    throw erro;
  }
}

type JournalMigrations = {
  entries: Array<{ idx: number; tag: string; when: number }>;
};

/**
 * Cria uma pasta temporária com as N primeiras migrations do journal. Serve
 * para reproduzir um "schema anterior" e depois atualizar até a última.
 */
export function criarRecorteMigrations(
  pastaMigracoes: string,
  quantidade: number,
) {
  const journal = JSON.parse(
    readFileSync(join(pastaMigracoes, "meta", "_journal.json"), "utf8"),
  ) as JournalMigrations;
  if (
    !Number.isInteger(quantidade) ||
    quantidade < 0 ||
    quantidade > journal.entries.length
  ) {
    throw new Error("Quantidade de migrations do recorte inválida.");
  }
  const pasta = mkdtempSync(join(tmpdir(), "nuu-recorte-migrations-"));
  mkdirSync(join(pasta, "meta"));
  const entradas = journal.entries.slice(0, quantidade);
  writeFileSync(
    join(pasta, "meta", "_journal.json"),
    JSON.stringify({ ...journal, entries: entradas }),
  );
  for (const entrada of entradas) {
    copyFileSync(
      join(pastaMigracoes, `${entrada.tag}.sql`),
      join(pasta, `${entrada.tag}.sql`),
    );
  }
  return {
    pasta,
    remover: () => rmSync(pasta, { recursive: true, force: true }),
  };
}

/**
 * Retrato comparável da estrutura do schema `public`: colunas, restrições,
 * índices e enums. Usado para provar que "anterior → última" e "0 → última"
 * chegam exatamente ao mesmo banco.
 */
export async function lerEstruturaBanco(url: string) {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  try {
    const consultas = await Promise.all([
      cliente.query(`
        SELECT table_name, column_name, data_type, udt_name, is_nullable,
          coalesce(column_default, '') AS padrao
        FROM information_schema.columns WHERE table_schema = 'public'
        ORDER BY table_name, column_name`),
      cliente.query(`
        SELECT conrelid::regclass::text AS tabela, conname,
          pg_get_constraintdef(oid, true) AS definicao
        FROM pg_constraint
        WHERE connamespace = 'public'::regnamespace
        ORDER BY 1, 2`),
      cliente.query(`
        SELECT indexname, indexdef FROM pg_indexes
        WHERE schemaname = 'public' ORDER BY indexname`),
      cliente.query(`
        SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS valores
        FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typnamespace = 'public'::regnamespace
        GROUP BY t.typname ORDER BY t.typname`),
    ]);
    return JSON.stringify(consultas.map((consulta) => consulta.rows));
  } finally {
    await cliente.end();
  }
}
