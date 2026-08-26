import { createHash, randomUUID } from "node:crypto";
import { closeSync, openSync, readFileSync, unlinkSync } from "node:fs";

import { parse } from "dotenv";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";

import {
  ANCORA_MIGRATIONS,
  type EntradaJournalValidacao,
  type MigrationLocalValidacao,
  validarDeltaSnapshotAmbientesLaquila,
  validarDeltaSnapshotConviteAdministrativo,
  validarDeltaSnapshotRbacGlobal,
  validarDeltaSnapshots,
  validarHistoricoAplicado,
  validarIdentidadeBanco,
  validarSequenciaLocal,
} from "./lib/validar-cadeia-migrations";
import { validarEstruturaPaginasDinamicas } from "./lib/validar-estrutura-paginas-dinamicas";

const API_NEON = "https://console.neon.tech/api/v2";
const PASTA_MIGRACOES = "./drizzle";
const SCHEMA_MIGRACOES = "drizzle_v2";
const TABELA_MIGRACOES = "__drizzle_migrations";
const BANCO_PRINCIPAL = "neondb";
const BANCO_VAZIO = "validacao_cadeia_vazia";
const PAPEL_BANCO = "neondb_owner";
const BRANCH_DESENVOLVIMENTO = "br-frosty-sea-acjpjuxk";
const ENDPOINT_DESENVOLVIMENTO = "ep-quiet-bar-acb7yly2";
const BRANCH_PRODUCAO = "br-lucky-smoke-acg7fz8x";
const ENDPOINT_PRODUCAO = "ep-proud-bonus-acy2bafx";
const PREFIXO_BRANCH_TEMPORARIA = "validacao-migrations-nuu-";
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

  private async requisitar<T>(
    metodo: "DELETE" | "GET" | "POST",
    caminho: string,
    corpo?: unknown,
  ): Promise<T> {
    const resposta = await fetch(`${API_NEON}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
        ...(corpo ? { "Content-Type": "application/json" } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
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
    }>("GET", `/projects/${this.projetoId}`);
  }

  listarBranches() {
    return this.requisitar<{ branches: BranchNeon[] }>(
      "GET",
      `/projects/${this.projetoId}/branches`,
    );
  }

  listarEndpoints() {
    return this.requisitar<{ endpoints: EndpointNeon[] }>(
      "GET",
      `/projects/${this.projetoId}/endpoints`,
    );
  }

  buscarBranch(branchId: string) {
    return this.requisitar<{ branch: BranchNeon }>(
      "GET",
      `/projects/${this.projetoId}/branches/${branchId}`,
    );
  }

  criarBranch(nome: string, expiraEm: string) {
    return this.requisitar<{
      branch: BranchNeon;
      endpoints?: EndpointNeon[];
    }>("POST", `/projects/${this.projetoId}/branches`, {
      branch: {
        name: nome,
        parent_id: BRANCH_DESENVOLVIMENTO,
        expires_at: expiraEm,
      },
      endpoints: [{ type: "read_write" }],
    });
  }

  criarBanco(branchId: string) {
    return this.requisitar<{ database: { name: string; owner_name: string } }>(
      "POST",
      `/projects/${this.projetoId}/branches/${branchId}/databases`,
      { database: { name: BANCO_VAZIO, owner_name: PAPEL_BANCO } },
    );
  }

  listarBancos(branchId: string) {
    return this.requisitar<{
      databases: Array<{ name: string; owner_name: string }>;
    }>("GET", `/projects/${this.projetoId}/branches/${branchId}/databases`);
  }

  async aguardarBanco(branchId: string) {
    const limite = Date.now() + 60_000;
    while (Date.now() < limite) {
      const resposta = await this.listarBancos(branchId);
      const banco = resposta.databases.find(
        (item) => item.name === BANCO_VAZIO,
      );
      if (banco?.owner_name === PAPEL_BANCO) return;
      await pausar(1_000);
    }
    throw new Error(
      "O banco vazio não ficou disponível no prazo de 60 segundos.",
    );
  }

  async obterConexao(branchId: string, endpointId: string, banco: string) {
    const parametros = new URLSearchParams({
      branch_id: branchId,
      endpoint_id: endpointId,
      database_name: banco,
      role_name: PAPEL_BANCO,
      pooled: "false",
    });
    const resposta = await this.requisitar<{ uri: string }>(
      "GET",
      `/projects/${this.projetoId}/connection_uri?${parametros}`,
    );
    return exigirTexto(resposta.uri, "URI temporária retornada pela Neon");
  }

  excluirBranch(branchId: string) {
    return this.requisitar<unknown>(
      "DELETE",
      `/projects/${this.projetoId}/branches/${branchId}`,
    );
  }
}

function pausar(milissegundos: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milissegundos));
}

async function aguardarIdentidade(url: string) {
  const limite = Date.now() + 60_000;
  let ultimaFalha = "conexão indisponível";
  while (Date.now() < limite) {
    try {
      return await consultarIdentidade(url);
    } catch (erro) {
      ultimaFalha = erro instanceof Error ? erro.message : ultimaFalha;
      await pausar(1_000);
    }
  }
  throw new Error(
    `A conexão não ficou disponível no prazo esperado: ${ultimaFalha}`,
  );
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

async function aplicarMigrations(url: string) {
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), {
      migrationsFolder: PASTA_MIGRACOES,
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
      "O hash da migration 0036 diverge do migrator.",
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

async function executar() {
  const somentePreValidar = process.argv.includes("--pre-validar");
  const somenteValidar = process.argv.includes("--somente-validar");
  const liberarLock = adquirirLock();
  let branchTemporaria: { id: string; nome: string } | null = null;
  let limpezaConcluida = false;
  let etapa = "inicializacao";

  try {
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
    const migrations = carregarMigrationsLocais();

    etapa = "arquivos-locais";
    validarArquivosLocais(migrations);
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

    etapa = "criacao-branch-temporaria";
    const sufixo = `${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${randomUUID().slice(0, 8)}`;
    const nome = `${PREFIXO_BRANCH_TEMPORARIA}${sufixo}`;
    const expiraEm = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const criada = await neon.criarBranch(nome, expiraEm);
    const endpoint = criada.endpoints?.find(
      (item) => item.type === "read_write",
    );
    if (
      !criada.branch?.id ||
      criada.branch.parent_id !== BRANCH_DESENVOLVIMENTO ||
      !endpoint?.id
    ) {
      throw new ErroFluxoMigration(
        etapa,
        "A Neon não retornou a branch temporária e seu endpoint como esperado.",
      );
    }
    branchTemporaria = { id: criada.branch.id, nome };
    console.log(
      `[migrations] Branch temporária criada: ${branchTemporaria.id}.`,
    );

    etapa = "conexao-clone";
    const urlClone = await neon.obterConexao(
      branchTemporaria.id,
      endpoint.id,
      BANCO_PRINCIPAL,
    );
    const identidadeClone = await aguardarIdentidade(urlClone);
    validarIdentidade(
      identidadeClone,
      {
        projetoId,
        branchId: branchTemporaria.id,
        endpointId: endpoint.id,
        banco: BANCO_PRINCIPAL,
      },
      etapa,
    );
    const totalCloneAntes = await contarMigrations(urlClone);
    if (totalCloneAntes !== estado.totalAplicadas) {
      throw new ErroFluxoMigration(
        etapa,
        "O clone não reproduziu o journal de desenvolvimento.",
      );
    }

    etapa = "migration-sobre-clone";
    await aplicarMigrations(urlClone);
    const totalCloneDepois = await contarMigrations(urlClone);
    if (totalCloneDepois !== migrations.length) {
      throw new ErroFluxoMigration(
        etapa,
        "O clone não registrou toda a sequência esperada.",
      );
    }
    const estruturaClone = await validarEstruturaVendaCruzada(urlClone);
    const paginasDinamicasClone =
      await consultarEstruturaPaginasDinamicas(urlClone);
    console.log(
      `[migrations] Atualização sobre clone aprovada: ${totalCloneAntes} -> ${totalCloneDepois}.`,
    );

    etapa = "criacao-banco-vazio";
    const bancoCriado = await neon.criarBanco(branchTemporaria.id);
    if (
      bancoCriado.database?.name !== BANCO_VAZIO ||
      bancoCriado.database.owner_name !== PAPEL_BANCO
    ) {
      throw new ErroFluxoMigration(
        etapa,
        "A Neon retornou um banco vazio inesperado.",
      );
    }
    await neon.aguardarBanco(branchTemporaria.id);
    const urlVazio = await neon.obterConexao(
      branchTemporaria.id,
      endpoint.id,
      BANCO_VAZIO,
    );
    const identidadeVazio = await aguardarIdentidade(urlVazio);
    validarIdentidade(
      identidadeVazio,
      {
        projetoId,
        branchId: branchTemporaria.id,
        endpointId: endpoint.id,
        banco: BANCO_VAZIO,
      },
      etapa,
    );
    if ((await contarMigrations(urlVazio)) !== 0) {
      throw new ErroFluxoMigration(
        etapa,
        "O banco reservado à cadeia completa não está vazio.",
      );
    }

    etapa = "cadeia-completa-banco-vazio";
    await aplicarMigrations(urlVazio);
    const totalVazio = await contarMigrations(urlVazio);
    if (totalVazio !== migrations.length) {
      throw new ErroFluxoMigration(
        etapa,
        "A cadeia completa não registrou todas as migrations.",
      );
    }
    const estruturaVazio = await validarEstruturaVendaCruzada(urlVazio);
    const paginasDinamicasVazio =
      await consultarEstruturaPaginasDinamicas(urlVazio);
    console.log(
      `[migrations] Cadeia completa no banco vazio aprovada: 0 -> ${totalVazio}.`,
    );

    if (somenteValidar) {
      console.log(
        "[migrations] Modo somente validação: desenvolvimento permaneceu inalterado.",
      );
    } else {
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
      const estruturaDev =
        await validarEstruturaVendaCruzada(urlDesenvolvimento);
      const paginasDinamicasDev =
        await consultarEstruturaPaginasDinamicas(urlDesenvolvimento);
      console.log(
        `[migrations] Desenvolvimento atualizado: ${estado.totalAplicadas} -> ${totalDevDepois}.`,
      );
      console.log(
        JSON.stringify(
          {
            validacao: {
              clone: estruturaClone,
              bancoVazio: estruturaVazio,
              desenvolvimento: estruturaDev,
              paginasDinamicas: {
                clone: paginasDinamicasClone,
                bancoVazio: paginasDinamicasVazio,
                desenvolvimento: paginasDinamicasDev,
              },
            },
          },
          null,
          2,
        ),
      );
    }
  } catch (erro) {
    const origem = erro instanceof ErroFluxoMigration ? erro.etapa : etapa;
    const mensagem = descreverErroSeguro(erro);
    console.error(`[migrations] Falha na etapa ${origem}: ${mensagem}`);
    process.exitCode = 1;
  } finally {
    if (branchTemporaria) {
      try {
        const ambienteNeon = carregarAmbiente(".env.neon.local");
        const neon = new ClienteNeon(
          exigirTexto(ambienteNeon.NEON_API_KEY, "NEON_API_KEY"),
          exigirTexto(ambienteNeon.NEON_PROJECT_ID, "NEON_PROJECT_ID"),
        );
        const confirmacao = await neon.buscarBranch(branchTemporaria.id);
        if (
          confirmacao.branch.id !== branchTemporaria.id ||
          confirmacao.branch.name !== branchTemporaria.nome ||
          confirmacao.branch.parent_id !== BRANCH_DESENVOLVIMENTO ||
          !confirmacao.branch.name.startsWith(PREFIXO_BRANCH_TEMPORARIA)
        ) {
          throw new Error(
            "a identidade da branch não corresponde à criada nesta execução",
          );
        }
        await neon.excluirBranch(branchTemporaria.id);
        limpezaConcluida = true;
        console.log(
          `[migrations] Branch temporária removida: ${branchTemporaria.id}.`,
        );
      } catch (erro) {
        const mensagem = descreverErroSeguro(erro);
        console.error(
          `[migrations] LIMPEZA PENDENTE para ${branchTemporaria.id}: ${mensagem}`,
        );
        process.exitCode = 1;
      }
    }
    liberarLock();
    if (branchTemporaria && !limpezaConcluida) {
      console.error(
        `[migrations] Remova manualmente somente a branch ${branchTemporaria.id} se a API confirmar sua identidade.`,
      );
    }
  }
}

executar().catch((erro) => {
  const mensagem = descreverErroSeguro(erro);
  console.error(`[migrations] Falha não tratada: ${mensagem}`);
  process.exit(1);
});
