import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { parse } from "dotenv";
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { Client } from "pg";

import * as schemaAtual from "../src/db/schema";

type ConfiguracaoSegura = {
  urlPrincipal: string;
  urlClone: string;
  nomeEsperado: string;
  endpointEsperado: string;
};

type IdentidadeNeon = {
  banco: string;
  projetoId: string;
  branchId: string;
  endpointId: string;
  branchNome: string | null;
  replica: boolean;
};

type LinhaCatalogo = Record<string, boolean | number | string | null>;

const CAMINHO_AMBIENTE_PRINCIPAL = ".env";
const CAMINHO_AMBIENTE_CLONE = ".env.baseline-clone.local";
const TABELA_ORFA = "diagnosticos_cotacoes_frete_paralelas";

function lerAmbiente(caminho: string) {
  return parse(readFileSync(caminho));
}

function exigirTexto(valor: string | undefined, nome: string) {
  const texto = valor?.trim();

  if (!texto) {
    throw new Error(`Configuração obrigatória ausente: ${nome}.`);
  }

  return texto;
}

function extrairEndpointDoHost(url: URL) {
  return url.hostname.split(".")[0]?.replace(/-pooler$/, "") ?? "";
}

function carregarConfiguracao(): ConfiguracaoSegura {
  const ambientePrincipal = lerAmbiente(CAMINHO_AMBIENTE_PRINCIPAL);
  const ambienteClone = lerAmbiente(CAMINHO_AMBIENTE_CLONE);
  const urlPrincipal = exigirTexto(
    ambientePrincipal.DATABASE_URL,
    "DATABASE_URL",
  );
  const urlClone = exigirTexto(
    ambienteClone.DATABASE_URL_BASELINE_CLONE,
    "DATABASE_URL_BASELINE_CLONE",
  );
  const nomeEsperado = exigirTexto(
    ambienteClone.BASELINE_CLONE_NOME_ESPERADO,
    "BASELINE_CLONE_NOME_ESPERADO",
  );
  const endpointEsperado = exigirTexto(
    ambienteClone.BASELINE_CLONE_ENDPOINT_ESPERADO,
    "BASELINE_CLONE_ENDPOINT_ESPERADO",
  );

  if (ambienteClone.BASELINE_CLONE_DESCARTAVEL !== "SIM") {
    throw new Error("A conexão não está explicitamente marcada como descartável.");
  }

  const principal = new URL(urlPrincipal);
  const clone = new URL(urlClone);
  const endpointClone = extrairEndpointDoHost(clone);
  const endpointPrincipal = extrairEndpointDoHost(principal);

  if (urlClone === urlPrincipal || clone.hostname === principal.hostname) {
    throw new Error("Operação recusada: a conexão informada é a principal.");
  }

  if (endpointClone === endpointPrincipal) {
    throw new Error("Operação recusada: o endpoint informado é o principal.");
  }

  if (endpointClone !== endpointEsperado) {
    throw new Error("Operação recusada: endpoint descartável inesperado.");
  }

  if (nomeEsperado !== "baseline-adocao-clone") {
    throw new Error("Operação recusada: nome lógico descartável inesperado.");
  }

  return {
    urlPrincipal,
    urlClone,
    nomeEsperado,
    endpointEsperado,
  };
}

async function consultarIdentidade(
  cliente: Client,
): Promise<IdentidadeNeon> {
  const resultado = await cliente.query<{
    banco: string;
    branch_id: string | null;
    branch_nome: string | null;
    endpoint_id: string | null;
    projeto_id: string | null;
    replica: boolean;
  }>(`
    SELECT
      current_database() AS banco,
      current_setting('neon.project_id', true) AS projeto_id,
      current_setting('neon.branch_id', true) AS branch_id,
      current_setting('neon.endpoint_id', true) AS endpoint_id,
      current_setting('neon.branch_name', true) AS branch_nome,
      pg_is_in_recovery() AS replica
  `);
  const identidade = resultado.rows[0];

  if (
    !identidade?.projeto_id ||
    !identidade.branch_id ||
    !identidade.endpoint_id
  ) {
    throw new Error("A conexão não forneceu a identidade técnica esperada do Neon.");
  }

  return {
    banco: identidade.banco,
    projetoId: identidade.projeto_id,
    branchId: identidade.branch_id,
    endpointId: identidade.endpoint_id,
    branchNome: identidade.branch_nome || null,
    replica: identidade.replica,
  };
}

async function consultarCatalogo(cliente: Client) {
  const consultas = {
    tabelas: `
      SELECT schemaname AS esquema, tablename AS tabela
      FROM pg_catalog.pg_tables
      WHERE schemaname IN ('public', 'drizzle')
      ORDER BY schemaname, tablename
    `,
    colunas: `
      SELECT
        table_schema AS esquema,
        table_name AS tabela,
        ordinal_position AS posicao,
        column_name AS coluna,
        data_type AS tipo,
        udt_name AS tipo_interno,
        is_nullable AS aceita_nulo,
        column_default AS valor_padrao
      FROM information_schema.columns
      WHERE table_schema IN ('public', 'drizzle')
      ORDER BY table_schema, table_name, ordinal_position
    `,
    restricoes: `
      SELECT
        namespace.nspname AS esquema,
        tabela.relname AS tabela,
        restricao.conname AS nome,
        restricao.contype AS tipo,
        pg_get_constraintdef(restricao.oid, true) AS definicao
      FROM pg_catalog.pg_constraint restricao
      JOIN pg_catalog.pg_class tabela ON tabela.oid = restricao.conrelid
      JOIN pg_catalog.pg_namespace namespace ON namespace.oid = tabela.relnamespace
      WHERE namespace.nspname IN ('public', 'drizzle')
      ORDER BY namespace.nspname, tabela.relname, restricao.conname
    `,
    indices: `
      SELECT
        schemaname AS esquema,
        tablename AS tabela,
        indexname AS nome,
        indexdef AS definicao
      FROM pg_catalog.pg_indexes
      WHERE schemaname IN ('public', 'drizzle')
      ORDER BY schemaname, tablename, indexname
    `,
    enums: `
      SELECT
        namespace.nspname AS esquema,
        tipo.typname AS nome,
        enum.enumsortorder AS ordem,
        enum.enumlabel AS valor
      FROM pg_catalog.pg_type tipo
      JOIN pg_catalog.pg_enum enum ON enum.enumtypid = tipo.oid
      JOIN pg_catalog.pg_namespace namespace ON namespace.oid = tipo.typnamespace
      WHERE namespace.nspname = 'public'
      ORDER BY namespace.nspname, tipo.typname, enum.enumsortorder
    `,
    sequencias: `
      SELECT
        sequence_schema AS esquema,
        sequence_name AS nome,
        data_type AS tipo,
        start_value AS valor_inicial,
        minimum_value AS valor_minimo,
        maximum_value AS valor_maximo,
        increment AS incremento,
        cycle_option AS ciclica
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
      ORDER BY sequence_schema, sequence_name
    `,
  };
  const catalogo: Record<string, LinhaCatalogo[]> = {};

  for (const [nome, sql] of Object.entries(consultas)) {
    const resultado = await cliente.query<LinhaCatalogo>(sql);
    catalogo[nome] = resultado.rows;
  }

  return catalogo;
}

function resumirIdentificador(valor: string) {
  return createHash("sha256").update(valor).digest("hex").slice(0, 12);
}

function calcularFingerprint(catalogo: Record<string, LinhaCatalogo[]>) {
  return createHash("sha256")
    .update(JSON.stringify(catalogo))
    .digest("hex");
}

function listarTabelasDoSchemaAtual(): string[] {
  return [
    ...new Set<string>(
      Object.values(schemaAtual)
        .filter((valor) => is(valor, PgTable))
        .map((tabela) => getTableName(tabela)),
    ),
  ].sort();
}

async function executar() {
  const configuracao = carregarConfiguracao();
  const principal = new Client({ connectionString: configuracao.urlPrincipal });
  const clone = new Client({ connectionString: configuracao.urlClone });

  await principal.connect();
  await clone.connect();

  try {
    await principal.query("BEGIN READ ONLY");
    await clone.query("BEGIN READ ONLY");

    const identidadePrincipal = await consultarIdentidade(principal);
    const identidadeClone = await consultarIdentidade(clone);

    if (identidadeClone.projetoId !== identidadePrincipal.projetoId) {
      throw new Error("Operação recusada: o clone pertence a outro projeto Neon.");
    }

    if (identidadeClone.branchId === identidadePrincipal.branchId) {
      throw new Error("Operação recusada: a branch informada é a principal.");
    }

    if (identidadeClone.endpointId === identidadePrincipal.endpointId) {
      throw new Error("Operação recusada: o endpoint informado é o principal.");
    }

    if (identidadeClone.endpointId !== configuracao.endpointEsperado) {
      throw new Error(
        "Operação recusada: o endpoint da sessão não corresponde ao descartável esperado.",
      );
    }

    if (identidadeClone.replica) {
      throw new Error("Operação recusada: o clone está conectado a uma réplica.");
    }

    const [catalogoPrincipal, catalogoClone] = await Promise.all([
      consultarCatalogo(principal),
      consultarCatalogo(clone),
    ]);
    const fingerprintPrincipal = calcularFingerprint(catalogoPrincipal);
    const fingerprintClone = calcularFingerprint(catalogoClone);

    if (fingerprintClone !== fingerprintPrincipal) {
      throw new Error(
        "Operação recusada: o fingerprint do clone difere do banco principal.",
      );
    }

    const tabelas = catalogoClone.tabelas ?? [];
    const tabelasPublicas = tabelas.filter(
      (item) => item.esquema === "public",
    );
    const nomesTabelasPublicas = tabelasPublicas
      .map((item) => String(item.tabela))
      .sort();
    const tabelasSchemaAtual = listarTabelasDoSchemaAtual();
    const tabelasSchemaAusentesNoClone = tabelasSchemaAtual.filter(
      (tabela) => !nomesTabelasPublicas.includes(tabela),
    );
    const tabelasExtrasNoClone = nomesTabelasPublicas.filter(
      (tabela) => !tabelasSchemaAtual.includes(tabela),
    );
    const possuiTabelaOrfa = tabelasPublicas.some(
      (item) => item.tabela === TABELA_ORFA,
    );
    const extrasEsperadas =
      tabelasExtrasNoClone.length === 1 &&
      tabelasExtrasNoClone[0] === TABELA_ORFA;

    if (tabelasSchemaAusentesNoClone.length > 0 || !extrasEsperadas) {
      throw new Error(
        "Operação recusada: as tabelas do clone divergem do schema atual.",
      );
    }

    await principal.query("COMMIT");
    await clone.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          seguranca: {
            marcadaComoDescartavel: true,
            diferenteDaConexaoPrincipal: true,
            mesmoProjetoDaPrincipal: true,
            branchDiferenteDaPrincipal: true,
            endpointDiferenteDaPrincipal: true,
            fingerprintIgualAoPrincipal: true,
          },
          identidade: {
            nomeLogicoEsperado: configuracao.nomeEsperado,
            banco: identidadeClone.banco,
            projeto: resumirIdentificador(identidadeClone.projetoId),
            branch: resumirIdentificador(identidadeClone.branchId),
            endpoint: identidadeClone.endpointId,
            nomeDaBranchExpostoPeloServidor: identidadeClone.branchNome,
          },
          estrutura: {
            totalTabelas: tabelas.length,
            tabelasPublicas: tabelasPublicas.length,
            tabelasAdministradasPeloSchema: tabelasSchemaAtual.length,
            tabelasDoSchemaAusentesNoClone: tabelasSchemaAusentesNoClone,
            tabelasExtrasNoClone,
            possuiTabelaOrfa,
            totalColunas: catalogoClone.colunas?.length ?? 0,
            totalRestricoes: catalogoClone.restricoes?.length ?? 0,
            totalIndices: catalogoClone.indices?.length ?? 0,
            totalValoresEnum: catalogoClone.enums?.length ?? 0,
            totalSequencias: catalogoClone.sequencias?.length ?? 0,
          },
          fingerprint: {
            algoritmo: "sha256",
            valor: fingerprintClone,
            escopo: [
              "tabelas",
              "colunas",
              "restricoes",
              "indices",
              "enums",
              "sequencias",
            ],
          },
        },
        null,
        2,
      ),
    );
  } catch (erro) {
    await Promise.allSettled([
      principal.query("ROLLBACK"),
      clone.query("ROLLBACK"),
    ]);
    throw erro;
  } finally {
    await Promise.allSettled([principal.end(), clone.end()]);
  }
}

executar().catch((erro) => {
  const mensagem =
    erro instanceof Error
      ? erro.message
      : "Falha desconhecida durante a verificação.";

  // Nunca imprime URLs, objetos do driver ou configurações de conexão.
  console.error(`[baseline-clone] ${mensagem}`);
  process.exit(1);
});
