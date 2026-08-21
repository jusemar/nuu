import { readMigrationFiles } from "drizzle-orm/migrator";
import { Client } from "pg";

const PASTA_MIGRACOES = "./drizzle";
const SCHEMA_MIGRACOES = "drizzle_v2";
const TABELA_MIGRACOES = "__drizzle_migrations";

type RegistroAplicado = {
  hash: string;
  created_at: string;
};

function descreverErroSeguro(erro: unknown) {
  if (!(erro instanceof Error)) return "erro sem detalhes";

  const codigo =
    "code" in erro && typeof erro.code === "string" ? ` (${erro.code})` : "";

  return `${erro.name}${codigo}: ${erro.message}`.replace(
    /postgres(?:ql)?:\/\/[^\s]+/gi,
    "[CONEXAO_MASCARADA]",
  );
}

async function consultarAplicadas(url: string): Promise<RegistroAplicado[]> {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();

  try {
    await cliente.query("BEGIN READ ONLY");
    const resultado = await cliente.query<RegistroAplicado>(`
      SELECT hash, created_at::text AS created_at
      FROM ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}
      ORDER BY created_at ASC, id ASC
    `);
    await cliente.query("COMMIT");
    return resultado.rows;
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }
}

async function executar() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log(
      "[schema-deploy] Verificação ignorada fora de um build Vercel de produção.",
    );
    return;
  }

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL não está disponível no build Vercel de produção.",
    );
  }

  // Usa o mesmo leitor do migrator Drizzle: hashes e `folderMillis` vêm da cadeia oficial.
  const locais = readMigrationFiles({ migrationsFolder: PASTA_MIGRACOES });
  const aplicadas = await consultarAplicadas(url);

  if (aplicadas.length !== locais.length) {
    throw new Error(
      `Schema incompatível: repositório ${locais.length}/${locais.length}, produção ${aplicadas.length}/${locais.length}. Aplique as migrations oficiais antes do deploy.`,
    );
  }

  const divergencia = locais.findIndex((migration, indice) => {
    const aplicada = aplicadas[indice];
    return (
      aplicada?.hash !== migration.hash ||
      Number(aplicada.created_at) !== migration.folderMillis
    );
  });

  if (divergencia >= 0) {
    throw new Error(
      `Histórico de migrations divergente no registro ${divergencia + 1}. O deploy foi bloqueado.`,
    );
  }

  console.log(
    `[schema-deploy] Cadeia compatível: produção ${aplicadas.length}/${locais.length}.`,
  );
}

executar().catch((erro) => {
  console.error(`\n[schema-deploy] ${descreverErroSeguro(erro)}\n`);
  process.exit(1);
});
