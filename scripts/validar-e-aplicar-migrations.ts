import { createHash } from "node:crypto";
import { closeSync, openSync, readFileSync, unlinkSync } from "node:fs";

import { parse } from "dotenv";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";

import {
  criarRecorteMigrations,
  lerEstruturaBanco,
  type PostgresDescartavel,
  subirPostgresDescartavel,
} from "./lib/postgres-docker-descartavel";
import {
  consultarMigrationsLocais,
  descreverUrlSemSegredo,
  garantirPostgresLocal,
} from "./lib/postgres-local";
import {
  ANCORA_MIGRATIONS,
  type EntradaJournalValidacao,
  type MigrationLocalValidacao,
  validarDeltaSnapshotAmbientesLaquila,
  validarDeltaSnapshotColunasLegadasEntregaPropria,
  validarDeltaSnapshotConsolidacaoEntregaPropria,
  validarDeltaSnapshotConviteAdministrativo,
  validarDeltaSnapshotDisponibilidadeFreteExterno,
  validarDeltaSnapshotEntregaPropriaCategoria,
  validarDeltaSnapshotIntegridadeEntregaPropria,
  validarDeltaSnapshotPoliticasEntregaPropria,
  validarDeltaSnapshotRbacGlobal,
  validarDeltaSnapshots,
  validarDeltaSnapshotTabelasLegadasEntregaPropria,
  validarDeltaSnapshotVinculoBairroAvulsoEntregaPropria,
  validarHistoricoAplicado,
  validarIdentidadeBanco,
  validarSequenciaLocal,
  validarSnapshotMigracaoDadosEntregaPropria,
  validarSnapshotPreparacaoColunasLegadasEntregaPropria,
  validarSnapshotVerificacaoLimpezaEntregaPropria,
} from "./lib/validar-cadeia-migrations";
import { validarEstruturaPaginasDinamicas } from "./lib/validar-estrutura-paginas-dinamicas";

const API_NEON = "https://console.neon.tech/api/v2";
const PASTA_MIGRACOES = "./drizzle";
const SCHEMA_MIGRACOES = "drizzle_v2";
const TABELA_MIGRACOES = "__drizzle_migrations";
const BANCO_PRINCIPAL = "neondb";
const BANCO_VAZIO = "validacao_cadeia_vazia";
const BANCO_ATUALIZACAO = "validacao_atualizacao";
const PAPEL_BANCO = "neondb_owner";
const BRANCH_DESENVOLVIMENTO = "br-frosty-sea-acjpjuxk";
const ENDPOINT_DESENVOLVIMENTO = "ep-quiet-bar-acb7yly2";
const BRANCH_PRODUCAO = "br-lucky-smoke-acg7fz8x";
const ENDPOINT_PRODUCAO = "ep-proud-bonus-acy2bafx";
/**
 * A validação descartável roda em PostgreSQL local (Docker). Nenhuma branch
 * Neon é criada: o cliente Neon abaixo só faz leituras (GET) da topologia.
 */
const PREFIXO_POSTGRES_DESCARTAVEL = "nuu-validacao-migrations";
const ARQUIVO_LOCK = "/tmp/nuu-validacao-migrations.lock";

type IdentidadeBanco = {
  banco: string;
  usuario: string;
  projetoId: string;
  branchId: string;
  endpointId: string;
};

type BranchNeon = {
  id: string;
  name: string;
  parent_id?: string;
  primary: boolean;
};

type EndpointNeon = {
  id: string;
  branch_id: string;
  type: string;
};

type MigrationLocal = MigrationLocalValidacao;

class ErroFluxoMigration extends Error {
  constructor(
    readonly etapa: string,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroFluxoMigration";
  }
}

function carregarAmbiente(caminho: string) {
  return parse(readFileSync(caminho));
}

function exigirTexto(valor: string | undefined, nome: string) {
  const texto = valor?.trim();
  if (!texto)
    throw new ErroFluxoMigration("configuracao", `${nome} não configurada.`);
  return texto;
}

function extrairEndpoint(url: string) {
  try {
    return new URL(url).hostname.split(".")[0]?.replace(/-pooler$/, "") ?? "";
  } catch {
    throw new ErroFluxoMigration(
      "configuracao",
      "A URL de desenvolvimento é inválida.",
    );
  }
}

function mensagemApiSegura(corpo: unknown) {
  if (!corpo || typeof corpo !== "object") return "resposta não detalhada";
  const mensagem = "message" in corpo ? corpo.message : undefined;
  return typeof mensagem === "string" ? mensagem : "resposta não detalhada";
}

function descreverErroSeguro(erro: unknown) {
  const partes: string[] = [];
  if (erro instanceof Error) {
    if (erro.name) partes.push(erro.name);
    if (erro.message) partes.push(erro.message);
    const codigo = "code" in erro ? erro.code : undefined;
    if (typeof codigo === "string") partes.push(`código ${codigo}`);
    if (erro instanceof AggregateError) {
      for (const item of erro.errors) {
        if (item instanceof Error && item.message) partes.push(item.message);
        const codigoItem =
          item && typeof item === "object" && "code" in item
            ? item.code
            : undefined;
        if (typeof codigoItem === "string") partes.push(`código ${codigoItem}`);
      }
    }
  }
  return (
    [...new Set(partes)]
      .join(": ")
      .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[CONEXAO_MASCARADA]") ||
    "erro sem detalhes fornecidos pelo driver"
  );
}

class ClienteNeon {
  constructor(
    private readonly token: string,
    readonly projetoId: string,
  ) {}

  // Somente leitura: o fluxo nunca cria, altera ou remove recursos na Neon.
  private async requisitar<T>(caminho: string): Promise<T> {
    const resposta = await fetch(`${API_NEON}${caminho}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
    });
    const texto = await resposta.text();
    let json: unknown = {};
    try {
      json = texto ? JSON.parse(texto) : {};
    } catch {
      // O corpo bruto nunca é propagado: ele pode conter detalhes que não devem ir ao log.
    }
    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status}: ${mensagemApiSegura(json)}`);
    }
    return json as T;
  }

  buscarProjeto() {
    return this.requisitar<{
      project: { id: string; default_branch_id?: string };
    }>(`/projects/${this.projetoId}`);
  }

  listarBranches() {
    return this.requisitar<{ branches: BranchNeon[] }>(
      `/projects/${this.projetoId}/branches`,
    );
  }

  listarEndpoints() {
    return this.requisitar<{ endpoints: EndpointNeon[] }>(
      `/projects/${this.projetoId}/endpoints`,
    );
  }
}

function adquirirLock() {
  try {
    const descritor = openSync(ARQUIVO_LOCK, "wx", 0o600);
    closeSync(descritor);
  } catch {
    throw new ErroFluxoMigration(
      "concorrencia",
      `Já existe uma execução ou lock pendente em ${ARQUIVO_LOCK}.`,
    );
  }
  return () => {
    try {
      unlinkSync(ARQUIVO_LOCK);
    } catch {
      // A ausência do lock ao encerrar não autoriza nenhuma ação adicional.
    }
  };
}

async function consultarIdentidade(url: string): Promise<IdentidadeBanco> {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  try {
    await cliente.query("BEGIN READ ONLY");
    const resultado = await cliente.query<{
      banco: string;
      usuario: string;
      projeto_id: string | null;
      branch_id: string | null;
      endpoint_id: string | null;
    }>(
      `SELECT current_database() AS banco, current_user AS usuario,
        current_setting($1, true) AS projeto_id,
        current_setting($2, true) AS branch_id,
        current_setting($3, true) AS endpoint_id`,
      ["neon.project_id", "neon.branch_id", "neon.endpoint_id"],
    );
    await cliente.query("COMMIT");
    const linha = resultado.rows[0];
    if (!linha?.projeto_id || !linha.branch_id || !linha.endpoint_id) {
      throw new Error("O PostgreSQL não retornou a identidade Neon completa.");
    }
    return {
      banco: linha.banco,
      usuario: linha.usuario,
      projetoId: linha.projeto_id,
      branchId: linha.branch_id,
      endpointId: linha.endpoint_id,
    };
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }
}

function validarIdentidade(
  identidade: IdentidadeBanco,
  esperado: {
    projetoId: string;
    branchId: string;
    endpointId: string;
    banco: string;
  },
  etapa: string,
) {
  try {
    validarIdentidadeBanco(
      identidade,
      { ...esperado, usuario: PAPEL_BANCO },
      { branchId: BRANCH_PRODUCAO, endpointId: ENDPOINT_PRODUCAO },
    );
  } catch (erro) {
    throw new ErroFluxoMigration(
      etapa,
      erro instanceof Error ? erro.message : "Identidade recusada.",
    );
  }
}

async function contarMigrations(url: string) {
  return (await listarMigrationsAplicadas(url)).length;
}

async function listarMigrationsAplicadas(url: string) {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  try {
    const existe = await cliente.query<{ existe: string | null }>(
      "SELECT to_regclass($1)::text AS existe",
      [`${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}`],
    );
    if (!existe.rows[0]?.existe) return [];
    const resultado = await cliente.query<{
      hash: string;
      created_at: string | number;
    }>(
      `SELECT hash, created_at
       FROM ${SCHEMA_MIGRACOES}.${TABELA_MIGRACOES}
       ORDER BY created_at ASC, id ASC`,
    );
    return resultado.rows.map((item) => ({
      hash: item.hash,
      createdAt: Number(item.created_at),
    }));
  } finally {
    await cliente.end();
  }
}

async function aplicarMigrations(url: string, pasta = PASTA_MIGRACOES) {
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), {
      migrationsFolder: pasta,
      migrationsSchema: SCHEMA_MIGRACOES,
      migrationsTable: TABELA_MIGRACOES,
    });
  } finally {
    await pool.end();
  }
}

async function validarEstruturaVendaCruzada(url: string) {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  try {
    const [coluna, tabela, restricoes, indices] = await Promise.all([
      cliente.query<{ is_nullable: string; column_default: string | null }>(`
        SELECT is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'product'
          AND column_name = 'venda_cruzada_ativa'
      `),
      cliente.query<{ total: number }>(`
        SELECT count(*)::int AS total FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'produtos_venda_cruzada'
          AND column_name IN ('id', 'produto_principal_id', 'produto_oferecido_id', 'ordem', 'created_at', 'updated_at')
      `),
      cliente.query<{ nome: string; definicao: string }>(`
        SELECT conname AS nome, pg_get_constraintdef(oid, true) AS definicao
        FROM pg_constraint
        WHERE conrelid = 'public.produtos_venda_cruzada'::regclass
      `),
      cliente.query<{ nome: string }>(`
        SELECT indexname AS nome FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'produtos_venda_cruzada'
      `),
    ]);
    const nomesRestricoes = new Set(restricoes.rows.map((item) => item.nome));
    const nomesIndices = new Set(indices.rows.map((item) => item.nome));
    const colunaCorreta =
      coluna.rowCount === 1 &&
      coluna.rows[0]?.is_nullable === "NO" &&
      coluna.rows[0]?.column_default === "false";
    const estruturaCorreta =
      colunaCorreta &&
      tabela.rows[0]?.total === 6 &&
      nomesRestricoes.has("produtos_venda_cruzada_sem_autorrelacionamento") &&
      nomesRestricoes.has("produtos_venda_cruzada_ordem_valida") &&
      nomesRestricoes.has(
        "produtos_venda_cruzada_produto_principal_id_product_id_fk",
      ) &&
      nomesRestricoes.has(
        "produtos_venda_cruzada_produto_oferecido_id_product_id_fk",
      ) &&
      nomesIndices.has("produtos_venda_cruzada_principal_oferecido_unico") &&
      nomesIndices.has("produtos_venda_cruzada_principal_ordem_unica");
    if (!estruturaCorreta) {
      throw new Error(
        "A estrutura materializada da venda cruzada está incompleta.",
      );
    }
    return {
      colunaObrigatoriaComDefaultFalse: colunaCorreta,
      colunasDaTabela: tabela.rows[0]?.total ?? 0,
      restricoes: restricoes.rowCount,
      indices: indices.rowCount,
    };
  } finally {
    await cliente.end();
  }
}

async function consultarEstruturaPaginasDinamicas(url: string) {
  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  try {
    await cliente.query("BEGIN READ ONLY");
    const [tabelas, enums, indices, restricoes] = await Promise.all([
      cliente.query<{ nome: string }>(`
        SELECT table_name AS nome FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('paginas_dinamicas', 'grupos_navegacao', 'grupo_paginas')
      `),
      cliente.query<{ nome: string; valores: unknown }>(`
        SELECT t.typname AS nome,
          array_agg(e.enumlabel::text ORDER BY e.enumsortorder) AS valores
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
          AND t.typname IN ('grupo_navegacao_local', 'pagina_dinamica_status')
        GROUP BY t.typname
      `),
      cliente.query<{ nome: string }>(`
        SELECT indexname AS nome FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN ('paginas_dinamicas', 'grupos_navegacao', 'grupo_paginas')
      `),
      cliente.query<{ nome: string }>(`
        SELECT conname AS nome FROM pg_constraint
        WHERE conrelid = ANY(ARRAY[
          'public.paginas_dinamicas'::regclass,
          'public.grupos_navegacao'::regclass,
          'public.grupo_paginas'::regclass
        ])
      `),
    ]);
    await cliente.query("COMMIT");
    const estrutura = {
      tabelas: tabelas.rows.map((item) => item.nome),
      enums: enums.rows,
      indices: indices.rows.map((item) => item.nome),
      restricoes: restricoes.rows.map((item) => item.nome),
    };
    validarEstruturaPaginasDinamicas(estrutura);
    return {
      tabelas: estrutura.tabelas.length,
      enums: estrutura.enums.length,
      indices: estrutura.indices.length,
      restricoes: estrutura.restricoes.length,
    };
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }
}

function carregarMigrationsLocais(): MigrationLocal[] {
  return readMigrationFiles({ migrationsFolder: PASTA_MIGRACOES }).map(
    (item) => ({
      hash: item.hash,
      folderMillis: item.folderMillis,
    }),
  );
}

function validarArquivosLocais(migrations: MigrationLocal[]) {
  const journal = JSON.parse(
    readFileSync("drizzle/meta/_journal.json", "utf8"),
  ) as {
    entries?: EntradaJournalValidacao[];
  };
  const entradas = journal.entries ?? [];
  try {
    validarSequenciaLocal(migrations, entradas);
    validarDeltaSnapshots(
      JSON.parse(readFileSync("drizzle/meta/0028_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0029_snapshot.json", "utf8")),
    );
    validarDeltaSnapshotRbacGlobal(
      JSON.parse(readFileSync("drizzle/meta/0033_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0034_snapshot.json", "utf8")),
    );
    validarDeltaSnapshotConviteAdministrativo(
      JSON.parse(readFileSync("drizzle/meta/0034_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0035_snapshot.json", "utf8")),
    );
    validarDeltaSnapshotAmbientesLaquila(
      JSON.parse(readFileSync("drizzle/meta/0035_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0036_snapshot.json", "utf8")),
    );
    validarDeltaSnapshotPoliticasEntregaPropria(
      JSON.parse(readFileSync("drizzle/meta/0041_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0042_snapshot.json", "utf8")),
    );
    validarDeltaSnapshotConsolidacaoEntregaPropria(
      JSON.parse(readFileSync("drizzle/meta/0043_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0044_snapshot.json", "utf8")),
    );
    validarSnapshotMigracaoDadosEntregaPropria(
      JSON.parse(readFileSync("drizzle/meta/0044_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0045_snapshot.json", "utf8")),
    );
    validarDeltaSnapshotIntegridadeEntregaPropria(
      JSON.parse(readFileSync("drizzle/meta/0045_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0046_snapshot.json", "utf8")),
    );
    validarSnapshotVerificacaoLimpezaEntregaPropria(
      JSON.parse(readFileSync("drizzle/meta/0046_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0047_snapshot.json", "utf8")),
    );
    validarDeltaSnapshotVinculoBairroAvulsoEntregaPropria(
      JSON.parse(readFileSync("drizzle/meta/0047_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0048_snapshot.json", "utf8")),
    );
    validarDeltaSnapshotTabelasLegadasEntregaPropria(
      JSON.parse(readFileSync("drizzle/meta/0048_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0049_snapshot.json", "utf8")),
    );
    validarSnapshotPreparacaoColunasLegadasEntregaPropria(
      JSON.parse(readFileSync("drizzle/meta/0049_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0050_snapshot.json", "utf8")),
    );
    validarDeltaSnapshotColunasLegadasEntregaPropria(
      JSON.parse(readFileSync("drizzle/meta/0050_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0051_snapshot.json", "utf8")),
    );
    validarDeltaSnapshotDisponibilidadeFreteExterno(
      JSON.parse(readFileSync("drizzle/meta/0051_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0052_snapshot.json", "utf8")),
    );
    validarDeltaSnapshotEntregaPropriaCategoria(
      JSON.parse(readFileSync("drizzle/meta/0052_snapshot.json", "utf8")),
      JSON.parse(readFileSync("drizzle/meta/0053_snapshot.json", "utf8")),
    );
  } catch {
    throw new ErroFluxoMigration(
      "arquivos-locais",
      "Journal ou sequência local de migrations inesperada.",
    );
  }
  const sql = readFileSync(ANCORA_MIGRATIONS.ultimoArquivo, "utf8");
  const hash = createHash("sha256").update(sql).digest("hex");
  if (hash !== migrations.at(-1)?.hash) {
    throw new ErroFluxoMigration(
      "arquivos-locais",
      `O hash da migration ${ANCORA_MIGRATIONS.ultimaTag} diverge do migrator.`,
    );
  }
}

async function preValidar(
  neon: ClienteNeon,
  urlDesenvolvimento: string,
  migrations: MigrationLocal[],
) {
  if (extrairEndpoint(urlDesenvolvimento) !== ENDPOINT_DESENVOLVIMENTO) {
    throw new ErroFluxoMigration(
      "pre-validacao",
      "A URL local não aponta para o endpoint de desenvolvimento.",
    );
  }
  const [projeto, branches, endpoints, identidade, historico] =
    await Promise.all([
      neon.buscarProjeto(),
      neon.listarBranches(),
      neon.listarEndpoints(),
      consultarIdentidade(urlDesenvolvimento),
      listarMigrationsAplicadas(urlDesenvolvimento),
    ]);
  if (projeto.project.id !== neon.projetoId) {
    throw new ErroFluxoMigration(
      "pre-validacao",
      "A API respondeu com outro projeto.",
    );
  }
  const producao = branches.branches.find(
    (item) => item.id === BRANCH_PRODUCAO,
  );
  const desenvolvimento = branches.branches.find(
    (item) => item.id === BRANCH_DESENVOLVIMENTO,
  );
  const endpointDev = endpoints.endpoints.find(
    (item) => item.id === ENDPOINT_DESENVOLVIMENTO,
  );
  const endpointProd = endpoints.endpoints.find(
    (item) => item.id === ENDPOINT_PRODUCAO,
  );
  if (
    !producao?.primary ||
    desenvolvimento?.parent_id !== BRANCH_PRODUCAO ||
    endpointDev?.branch_id !== BRANCH_DESENVOLVIMENTO ||
    endpointProd?.branch_id !== BRANCH_PRODUCAO
  ) {
    throw new ErroFluxoMigration(
      "pre-validacao",
      "A topologia Neon diverge das identidades autorizadas.",
    );
  }
  validarIdentidade(
    identidade,
    {
      projetoId: neon.projetoId,
      branchId: BRANCH_DESENVOLVIMENTO,
      endpointId: ENDPOINT_DESENVOLVIMENTO,
      banco: BANCO_PRINCIPAL,
    },
    "pre-validacao",
  );
  try {
    validarHistoricoAplicado(historico, migrations);
  } catch {
    throw new ErroFluxoMigration(
      "pre-validacao",
      "O histórico de desenvolvimento diverge da cadeia local autorizada.",
    );
  }
  return {
    totalAplicadas: historico.length,
    totalLocais: migrations.length,
  };
}

function lerArgumentoNumerico(nome: string) {
  const argumento = process.argv.find((item) => item.startsWith(`--${nome}=`));
  if (!argumento) return undefined;
  const valor = Number(argumento.split("=")[1]);
  if (!Number.isInteger(valor) || valor < 0) {
    throw new ErroFluxoMigration(
      "configuracao",
      `--${nome} precisa ser um inteiro não negativo.`,
    );
  }
  return valor;
}

async function exigirTotal(
  url: string,
  esperado: number,
  etapa: string,
  mensagem: string,
) {
  if ((await contarMigrations(url)) !== esperado) {
    throw new ErroFluxoMigration(etapa, mensagem);
  }
}

/**
 * Validação descartável em PostgreSQL local (Docker):
 * 1. "schema anterior → última": aplica as `base` primeiras migrations e
 *    depois a cadeia inteira (reproduz um banco já existente sendo atualizado);
 * 2. "0 → última": aplica a cadeia completa num banco vazio;
 * 3. confere estruturas conhecidas e exige que os dois bancos fiquem idênticos.
 */
async function validarEmPostgresLocal(
  postgres: PostgresDescartavel,
  migrations: MigrationLocal[],
  base: number,
  registrarEtapa: (etapa: string) => void,
) {
  if (base > migrations.length) {
    throw new ErroFluxoMigration(
      "configuracao",
      "A base da atualização é maior que a cadeia local.",
    );
  }

  registrarEtapa("atualizacao-schema-anterior");
  const urlAtualizacao = await postgres.criarBanco(BANCO_ATUALIZACAO);
  await exigirTotal(
    urlAtualizacao,
    0,
    "atualizacao-schema-anterior",
    "O banco reservado à atualização não está vazio.",
  );
  if (base > 0) {
    const recorte = criarRecorteMigrations(PASTA_MIGRACOES, base);
    try {
      await postgres.confirmarIdentidade(urlAtualizacao, BANCO_ATUALIZACAO);
      await aplicarMigrations(urlAtualizacao, recorte.pasta);
    } finally {
      recorte.remover();
    }
    await exigirTotal(
      urlAtualizacao,
      base,
      "atualizacao-schema-anterior",
      "O schema anterior não registrou a base esperada.",
    );
  }
  await postgres.confirmarIdentidade(urlAtualizacao, BANCO_ATUALIZACAO);
  await aplicarMigrations(urlAtualizacao);
  await exigirTotal(
    urlAtualizacao,
    migrations.length,
    "atualizacao-schema-anterior",
    "A atualização não registrou toda a sequência esperada.",
  );
  const estruturaAtualizacao =
    await validarEstruturaVendaCruzada(urlAtualizacao);
  const paginasAtualizacao =
    await consultarEstruturaPaginasDinamicas(urlAtualizacao);
  console.log(
    `[migrations] Atualização local aprovada: ${base} -> ${migrations.length}.`,
  );

  registrarEtapa("cadeia-completa-banco-vazio");
  const urlVazio = await postgres.criarBanco(BANCO_VAZIO);
  await exigirTotal(
    urlVazio,
    0,
    "cadeia-completa-banco-vazio",
    "O banco reservado à cadeia completa não está vazio.",
  );
  await postgres.confirmarIdentidade(urlVazio, BANCO_VAZIO);
  await aplicarMigrations(urlVazio);
  await exigirTotal(
    urlVazio,
    migrations.length,
    "cadeia-completa-banco-vazio",
    "A cadeia completa não registrou todas as migrations.",
  );
  const estruturaVazio = await validarEstruturaVendaCruzada(urlVazio);
  const paginasVazio = await consultarEstruturaPaginasDinamicas(urlVazio);
  console.log(
    `[migrations] Cadeia completa local aprovada: 0 -> ${migrations.length}.`,
  );

  registrarEtapa("comparacao-estruturas");
  const [retratoAtualizacao, retratoVazio] = await Promise.all([
    lerEstruturaBanco(urlAtualizacao),
    lerEstruturaBanco(urlVazio),
  ]);
  if (retratoAtualizacao !== retratoVazio) {
    throw new ErroFluxoMigration(
      "comparacao-estruturas",
      "A atualização e a cadeia completa produziram estruturas diferentes.",
    );
  }
  console.log(
    "[migrations] Estruturas idênticas entre atualização e cadeia completa.",
  );

  return {
    atualizacao: estruturaAtualizacao,
    bancoVazio: estruturaVazio,
    paginasDinamicas: {
      atualizacao: paginasAtualizacao,
      bancoVazio: paginasVazio,
    },
  };
}

/**
 * Modos (todos sem criar branch Neon):
 * - `--somente-validar` (migrations:validar-apenas): só o PostgreSQL descartável.
 * - padrão (migrations:validar): descartável reproduzindo o banco local
 *   persistente e, se aprovado, aplica no PostgreSQL local persistente.
 * - `--homologacao` (migrations:homologacao): descartável + aplica na Neon
 *   `desenvolvimento-local`, somente quando pedido explicitamente.
 * - `--pre-validar` (migrations:homologacao:pre-validar): leitura da Neon homologação.
 */
async function executar() {
  const somentePreValidar = process.argv.includes("--pre-validar");
  const somenteValidar = process.argv.includes("--somente-validar");
  const homologacao = process.argv.includes("--homologacao");
  const liberarLock = adquirirLock();
  let postgres: PostgresDescartavel | null = null;
  let etapa = "inicializacao";
  const registrarEtapa = (novaEtapa: string) => {
    etapa = novaEtapa;
  };

  try {
    const migrations = carregarMigrationsLocais();
    etapa = "arquivos-locais";
    validarArquivosLocais(migrations);

    if (somenteValidar) {
      // Totalmente local: não lê .env da Neon nem consulta banco remoto.
      const base =
        lerArgumentoNumerico("atualizar-a-partir-de") ??
        Math.max(migrations.length - 1, 0);
      etapa = "postgres-local";
      postgres = await subirPostgresDescartavel(PREFIXO_POSTGRES_DESCARTAVEL);
      console.log(
        `[migrations] PostgreSQL local descartável: ${postgres.nome}.`,
      );
      await validarEmPostgresLocal(postgres, migrations, base, registrarEtapa);
      console.log(
        "[migrations] Modo somente validação: nenhum banco remoto foi consultado ou alterado.",
      );
      return;
    }

    if (!homologacao && !somentePreValidar) {
      // Padrão: banco local persistente (nooo-postgres-local). Neon não é lida.
      etapa = "postgres-local-persistente";
      const local = await garantirPostgresLocal();
      const estadoLocal = await consultarMigrationsLocais(local.url);
      console.log(
        `[migrations] Banco local persistente ${descreverUrlSemSegredo(local.url)}: ${estadoLocal.aplicadas}/${estadoLocal.noRepositorio}.`,
      );
      etapa = "postgres-local";
      postgres = await subirPostgresDescartavel(PREFIXO_POSTGRES_DESCARTAVEL);
      console.log(
        `[migrations] PostgreSQL local descartável: ${postgres.nome}.`,
      );
      await validarEmPostgresLocal(
        postgres,
        migrations,
        Math.min(estadoLocal.aplicadas, migrations.length),
        registrarEtapa,
      );
      etapa = "aplicacao-local-persistente";
      await aplicarMigrations(local.url);
      const depois = await consultarMigrationsLocais(local.url);
      if (depois.aplicadas !== migrations.length) {
        throw new ErroFluxoMigration(
          etapa,
          "O banco local persistente não registrou todas as migrations.",
        );
      }
      await validarEstruturaVendaCruzada(local.url);
      await consultarEstruturaPaginasDinamicas(local.url);
      console.log(
        `[migrations] Banco local persistente atualizado: ${estadoLocal.aplicadas} -> ${depois.aplicadas}. Nenhum banco remoto foi consultado.`,
      );
      return;
    }

    const ambienteNeon = carregarAmbiente(".env.neon.local");
    const ambienteDev = carregarAmbiente(".env.desenvolvimento.local");
    const token = exigirTexto(ambienteNeon.NEON_API_KEY, "NEON_API_KEY");
    const projetoId = exigirTexto(
      ambienteNeon.NEON_PROJECT_ID,
      "NEON_PROJECT_ID",
    );
    const urlDesenvolvimento = exigirTexto(
      ambienteDev.DATABASE_URL_DESENVOLVIMENTO,
      "DATABASE_URL_DESENVOLVIMENTO",
    );
    const neon = new ClienteNeon(token, projetoId);

    etapa = "pre-validacao";
    const estado = await preValidar(neon, urlDesenvolvimento, migrations);
    console.log(
      `[migrations] Pré-validação aprovada: ${estado.totalAplicadas}/${estado.totalLocais} aplicadas em desenvolvimento.`,
    );

    if (somentePreValidar || estado.totalAplicadas === estado.totalLocais) {
      if (estado.totalAplicadas === estado.totalLocais) {
        const estrutura =
          await consultarEstruturaPaginasDinamicas(urlDesenvolvimento);
        console.log(
          `[migrations] Estrutura de Páginas Dinâmicas aprovada: ${estrutura.tabelas} tabelas, ${estrutura.enums} enums, ${estrutura.indices} índices e ${estrutura.restricoes} restrições.`,
        );
      }
      console.log(
        somentePreValidar
          ? "[migrations] Modo pré-validação: nenhum recurso foi criado."
          : "[migrations] Não há migration pendente; nenhum recurso foi criado.",
      );
      return;
    }

    // O journal do desenvolvimento é reproduzido localmente (mesma base) antes
    // de qualquer escrita no desenvolvimento.
    etapa = "postgres-local";
    postgres = await subirPostgresDescartavel(PREFIXO_POSTGRES_DESCARTAVEL);
    console.log(`[migrations] PostgreSQL local descartável: ${postgres.nome}.`);
    const validacao = await validarEmPostgresLocal(
      postgres,
      migrations,
      estado.totalAplicadas,
      registrarEtapa,
    );

    etapa = "reconfirmacao-desenvolvimento";
    const reconfirmacao = await preValidar(
      neon,
      urlDesenvolvimento,
      migrations,
    );
    if (reconfirmacao.totalAplicadas !== estado.totalAplicadas) {
      throw new ErroFluxoMigration(
        etapa,
        "O journal de desenvolvimento mudou durante a validação.",
      );
    }
    etapa = "aplicacao-desenvolvimento";
    await aplicarMigrations(urlDesenvolvimento);
    const totalDevDepois = await contarMigrations(urlDesenvolvimento);
    if (totalDevDepois !== migrations.length) {
      throw new ErroFluxoMigration(
        etapa,
        "O desenvolvimento não registrou todas as migrations.",
      );
    }
    const estruturaDev = await validarEstruturaVendaCruzada(urlDesenvolvimento);
    const paginasDinamicasDev =
      await consultarEstruturaPaginasDinamicas(urlDesenvolvimento);
    console.log(
      `[migrations] Desenvolvimento atualizado: ${estado.totalAplicadas} -> ${totalDevDepois}.`,
    );
    console.log(
      JSON.stringify(
        {
          validacao: {
            ...validacao,
            desenvolvimento: estruturaDev,
            paginasDinamicasDesenvolvimento: paginasDinamicasDev,
          },
        },
        null,
        2,
      ),
    );
  } catch (erro) {
    const origem = erro instanceof ErroFluxoMigration ? erro.etapa : etapa;
    const mensagem = descreverErroSeguro(erro);
    console.error(`[migrations] Falha na etapa ${origem}: ${mensagem}`);
    process.exitCode = 1;
  } finally {
    if (postgres) {
      try {
        await postgres.remover();
        console.log(
          `[migrations] PostgreSQL local removido: ${postgres.nome}.`,
        );
      } catch (erro) {
        console.error(
          `[migrations] LIMPEZA PENDENTE do container ${postgres.nome}: ${descreverErroSeguro(erro)}`,
        );
        process.exitCode = 1;
      }
    }
    liberarLock();
  }
}

executar().catch((erro) => {
  const mensagem = descreverErroSeguro(erro);
  console.error(`[migrations] Falha não tratada: ${mensagem}`);
  process.exit(1);
});
