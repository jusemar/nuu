import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";

import {
  encerrarComFalhaDeDestino,
  exigirBancoProducao,
} from "./lib/guarda-banco-local";

/**
 * Aplica migrations pendentes em PRODUÇÃO, uma de cada vez e sempre nomeadas.
 *
 * Por que este script existe: `drizzle.config.ts` recusa `DATABASE_URL` de propósito, então
 * `drizzle-kit migrate` nunca alcança produção — e é assim que deve continuar. Quem opera em
 * produção precisa de um caminho próprio, mais difícil de acionar por engano e que diga em
 * voz alta o que vai fazer antes de fazer.
 *
 * Três camadas de proteção, todas antes de qualquer escrita:
 *   1. `exigirBancoProducao()` exige `AMBIENTE_BANCO=producao` **e** a variável
 *      `AUTORIZACAO_PRODUCAO` com o valor exato, e confirma no próprio servidor que o
 *      endpoint é mesmo o da branch `production`;
 *   2. `--somente=<tag[,tag...]>` exige que o operador escreva, em ordem, os nomes de todas
 *      as migrations que espera aplicar. Se a lista de pendentes não for exatamente essa,
 *      o script recusa e não escreve nada;
 *   3. `--conferir` roda o diagnóstico completo sem aplicar coisa alguma.
 *
 * Uso (sempre via package.json):
 *   npm run migrations:producao -- --conferir
 *   npm run migrations:producao -- --somente=0015_lush_red_wolf
 *   npm run migrations:producao -- --somente=0023_exemplo,0024_exemplo
 */

const PASTA_MIGRACOES = "./drizzle";
const SCHEMA_MIGRACOES = "drizzle_v2";
const TABELA_MIGRACOES = "__drizzle_migrations";

/** Nome da operação exigido por `exigirBancoProducao`. Compõe o valor de AUTORIZACAO_PRODUCAO. */
const OPERACAO = "APLICAR-MIGRATIONS";

type EntradaJornal = {
  idx: number;
  tag: string;
  when: number;
};

type MigrationLocal = {
  tag: string;
  quando: number;
  hash: string;
};

type RegistroAplicado = {
  hash: string;
  created_at: string;
};

/**
 * Lê o journal e calcula o hash de cada migration exatamente como o migrator do Drizzle faz
 * (`sha256` do conteúdo bruto do `.sql`). Reproduzir o cálculo aqui é o que permite conferir,
 * antes de aplicar, se o que está registrado no banco corresponde aos arquivos do repositório.
 */
function lerMigrationsLocais(): MigrationLocal[] {
  const journal = JSON.parse(
    readFileSync(`${PASTA_MIGRACOES}/meta/_journal.json`, "utf8"),
  ) as { entries: EntradaJornal[] };

  return journal.entries.map((entrada) => {
    const conteudo = readFileSync(
      `${PASTA_MIGRACOES}/${entrada.tag}.sql`,
      "utf8",
    );

    return {
      tag: entrada.tag,
      quando: entrada.when,
      hash: createHash("sha256").update(conteudo).digest("hex"),
    };
  });
}

async function consultarAplicadas(url: string): Promise<RegistroAplicado[]> {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();

  try {
    // Somente leitura: este diagnóstico não pode, em hipótese alguma, escrever.
    await cliente.query("BEGIN READ ONLY");
    const resultado = await cliente.query<RegistroAplicado>(`
      SELECT hash, created_at::text AS created_at
      FROM ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}
      ORDER BY created_at ASC
    `);
    await cliente.query("COMMIT");

    return resultado.rows;
  } finally {
    await cliente.end();
  }
}

/**
 * Reproduz a regra de seleção do migrator do Drizzle
 * (`node_modules/drizzle-orm/pg-core/dialect.js`): pendente é toda migration cujo `when` do
 * journal seja maior que o maior `created_at` já registrado. Não há comparação de hash na
 * seleção — por isso a conferência de integridade abaixo é feita à parte.
 */
function calcularPendentes(
  locais: MigrationLocal[],
  aplicadas: RegistroAplicado[],
): MigrationLocal[] {
  const ultimoRegistro = aplicadas.at(-1);

  if (!ultimoRegistro) return locais;

  const ultimoQuando = Number(ultimoRegistro.created_at);
  return locais.filter((migration) => migration.quando > ultimoQuando);
}

/**
 * Confere se cada migration já registrada continua idêntica ao arquivo do repositório.
 *
 * Divergência aqui significa que uma migration antiga foi editada depois de aplicada — o que
 * a regra do projeto proíbe. Aplicar novas migrations por cima de um histórico adulterado
 * esconderia o problema, então o script para.
 */
function conferirIntegridade(
  locais: MigrationLocal[],
  aplicadas: RegistroAplicado[],
): string[] {
  const problemas: string[] = [];
  const hashesLocais = new Set(locais.map((item) => item.hash));

  aplicadas.forEach((registro, indice) => {
    if (!hashesLocais.has(registro.hash)) {
      problemas.push(
        `registro #${indice + 1} (hash ${registro.hash.slice(0, 12)}…, created_at ${registro.created_at}) não corresponde a nenhum arquivo em ${PASTA_MIGRACOES}`,
      );
    }
  });

  return problemas;
}

function obterArgumento(nome: string): string | null {
  const prefixo = `--${nome}=`;
  const encontrado = process.argv.find((item) => item.startsWith(prefixo));

  return encontrado ? encontrado.slice(prefixo.length).trim() : null;
}

async function aplicar(url: string) {
  const pool = new Pool({ connectionString: url, max: 1 });
  const banco = drizzle(pool);

  try {
    // O migrator envolve todas as migrations pendentes numa única transação: se qualquer
    // instrução falhar, nada é aplicado e nada é registrado.
    await migrate(banco, {
      migrationsFolder: PASTA_MIGRACOES,
      migrationsSchema: SCHEMA_MIGRACOES,
      migrationsTable: TABELA_MIGRACOES,
    });
  } finally {
    await pool.end();
  }
}

async function executar() {
  const apenasConferir = process.argv.includes("--conferir");
  const somente = obterArgumento("somente");
  const esperadas = somente
    ?.split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!apenasConferir && !somente) {
    throw new Error(
      "Informe --somente=<tag-da-migration> para aplicar, ou --conferir para apenas diagnosticar.",
    );
  }

  const destino = await exigirBancoProducao(OPERACAO);

  const locais = lerMigrationsLocais();
  const aplicadas = await consultarAplicadas(destino.url);
  const pendentes = calcularPendentes(locais, aplicadas);

  console.log(`\nMigrations no repositório : ${locais.length}`);
  console.log(`Registradas em produção   : ${aplicadas.length}`);
  console.log(`Pendentes                 : ${pendentes.length}`);

  const problemas = conferirIntegridade(locais, aplicadas);

  if (problemas.length > 0) {
    throw new Error(
      `Histórico divergente — nenhuma migration foi aplicada:\n  - ${problemas.join("\n  - ")}`,
    );
  }

  console.log("Integridade do histórico  : ok (todos os hashes conferem)\n");

  if (pendentes.length === 0) {
    console.log("Nada pendente. Nenhuma alteração foi feita.\n");
    return;
  }

  console.log("Pendentes, em ordem de aplicação:");
  pendentes.forEach((migration) => {
    console.log(`  - ${migration.tag} (when=${migration.quando})`);
  });
  console.log("");

  if (apenasConferir) {
    console.log("Modo --conferir: nada foi aplicado.\n");
    return;
  }

  // A confirmação nominal é o que impede uma migration inesperada de entrar de carona: o
  // operador declara o que espera, e o script recusa qualquer coisa diferente disso.
  const tagsPendentes = pendentes.map((item) => item.tag);
  const listaEsperadaCorresponde =
    esperadas?.length === tagsPendentes.length &&
    esperadas.every((tag, indice) => tag === tagsPendentes[indice]);

  if (!listaEsperadaCorresponde) {
    throw new Error(
      `Recusado: --somente=${somente} não corresponde às pendentes (${tagsPendentes.join(", ") || "nenhuma"}). Nenhuma alteração foi feita.`,
    );
  }

  console.log(`Aplicando ${esperadas.join(", ")} em PRODUÇÃO…\n`);
  await aplicar(destino.url);

  const depois = await consultarAplicadas(destino.url);
  const novos = depois.filter(
    (registro) => !aplicadas.some((antigo) => antigo.hash === registro.hash),
  );

  console.log(`Registros antes  : ${aplicadas.length}`);
  console.log(`Registros depois : ${depois.length}`);
  console.log(`Novos registros  : ${novos.length}`);

  const registrosCorrespondem =
    novos.length === pendentes.length &&
    novos.every((registro, indice) => registro.hash === pendentes[indice].hash);

  if (!registrosCorrespondem) {
    throw new Error(
      "A migration foi executada, mas o registro resultante não é o esperado. Confira drizzle_v2.__drizzle_migrations manualmente.",
    );
  }

  console.log(
    `\n${esperadas.length} migration(s) aplicada(s) e registrada(s) uma única vez.\n`,
  );
}

executar().catch(encerrarComFalhaDeDestino);
