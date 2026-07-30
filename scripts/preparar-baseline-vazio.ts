import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { parse } from "dotenv";
import { Client } from "pg";

type Ambiente = Record<string, string>;

type IdentidadeNeon = {
  banco: string;
  projetoId: string;
  branchId: string;
  endpointId: string;
  replica: boolean;
};

type Configuracao = {
  urlPrincipal: string;
  urlCloneAdocao: string;
  urlAdministrativaVazio: string;
  urlBancoVazio: string;
  endpointVazioEsperado: string;
  nomeLogicoEsperado: string;
};

const BANCO_ADMINISTRATIVO = "neondb";
const BANCO_VAZIO = "baseline_vazio";
const NOME_LOGICO_ESPERADO = "baseline-criacao-vazia";
const CAMINHO_PRINCIPAL = ".env";
const CAMINHO_CLONE_ADOCAO = ".env.baseline-clone.local";
const CAMINHO_BASELINE_VAZIO = ".env.baseline-vazio.local";

function lerAmbiente(caminho: string): Ambiente {
  return parse(readFileSync(caminho));
}

function exigirTexto(valor: string | undefined, nome: string) {
  const texto = valor?.trim();

  if (!texto) {
    throw new Error(`Configuração obrigatória ausente: ${nome}.`);
  }

  return texto;
}

function extrairEndpoint(url: URL) {
  return url.hostname.split(".")[0]?.replace(/-pooler$/, "") ?? "";
}

function validarConfiguracao(configuracao: Configuracao) {
  const principal = new URL(configuracao.urlPrincipal);
  const cloneAdocao = new URL(configuracao.urlCloneAdocao);
  const administrativaVazio = new URL(configuracao.urlAdministrativaVazio);
  const bancoVazio = new URL(configuracao.urlBancoVazio);
  const endpointPrincipal = extrairEndpoint(principal);
  const endpointCloneAdocao = extrairEndpoint(cloneAdocao);
  const endpointVazio = extrairEndpoint(administrativaVazio);

  if (configuracao.nomeLogicoEsperado !== NOME_LOGICO_ESPERADO) {
    throw new Error("Operação recusada: nome lógico descartável inesperado.");
  }

  if (
    configuracao.urlAdministrativaVazio === configuracao.urlPrincipal ||
    administrativaVazio.hostname === principal.hostname ||
    endpointVazio === endpointPrincipal
  ) {
    throw new Error("Operação recusada: o alvo informado é a production.");
  }

  if (
    configuracao.urlAdministrativaVazio === configuracao.urlCloneAdocao ||
    administrativaVazio.hostname === cloneAdocao.hostname ||
    endpointVazio === endpointCloneAdocao
  ) {
    throw new Error(
      "Operação recusada: o alvo informado é baseline-adocao-clone.",
    );
  }

  if (endpointVazio !== configuracao.endpointVazioEsperado) {
    throw new Error("Operação recusada: endpoint de banco vazio inesperado.");
  }

  if (
    bancoVazio.hostname !== administrativaVazio.hostname ||
    extrairEndpoint(bancoVazio) !== endpointVazio
  ) {
    throw new Error(
      "Operação recusada: o banco vazio não usa o endpoint administrativo validado.",
    );
  }

  if (
    administrativaVazio.pathname.replace(/^\//, "") !== BANCO_ADMINISTRATIVO
  ) {
    throw new Error("Operação recusada: banco administrativo inesperado.");
  }

  if (bancoVazio.pathname.replace(/^\//, "") !== BANCO_VAZIO) {
    throw new Error("Operação recusada: nome do banco vazio inesperado.");
  }
}

function carregarConfiguracao(): Configuracao {
  const principal = lerAmbiente(CAMINHO_PRINCIPAL);
  const cloneAdocao = lerAmbiente(CAMINHO_CLONE_ADOCAO);
  const baselineVazio = lerAmbiente(CAMINHO_BASELINE_VAZIO);

  if (baselineVazio.BASELINE_VAZIO_DESCARTAVEL !== "SIM") {
    throw new Error("O alvo não está explicitamente marcado como descartável.");
  }

  const configuracao = {
    urlPrincipal: exigirTexto(principal.DATABASE_URL, "DATABASE_URL"),
    urlCloneAdocao: exigirTexto(
      cloneAdocao.DATABASE_URL_BASELINE_CLONE,
      "DATABASE_URL_BASELINE_CLONE",
    ),
    urlAdministrativaVazio: exigirTexto(
      baselineVazio.DATABASE_URL_BASELINE_VAZIO_ADMIN,
      "DATABASE_URL_BASELINE_VAZIO_ADMIN",
    ),
    urlBancoVazio: exigirTexto(
      baselineVazio.DATABASE_URL_BASELINE_VAZIO,
      "DATABASE_URL_BASELINE_VAZIO",
    ),
    endpointVazioEsperado: exigirTexto(
      baselineVazio.BASELINE_VAZIO_ENDPOINT_ESPERADO,
      "BASELINE_VAZIO_ENDPOINT_ESPERADO",
    ),
    nomeLogicoEsperado: exigirTexto(
      baselineVazio.BASELINE_VAZIO_NOME_ESPERADO,
      "BASELINE_VAZIO_NOME_ESPERADO",
    ),
  };

  validarConfiguracao(configuracao);
  return configuracao;
}

async function consultarIdentidade(cliente: Client): Promise<IdentidadeNeon> {
  const resultado = await cliente.query<{
    banco: string;
    branch_id: string | null;
    endpoint_id: string | null;
    projeto_id: string | null;
    replica: boolean;
  }>(`
    SELECT
      current_database() AS banco,
      current_setting('neon.project_id', true) AS projeto_id,
      current_setting('neon.branch_id', true) AS branch_id,
      current_setting('neon.endpoint_id', true) AS endpoint_id,
      pg_is_in_recovery() AS replica
  `);
  const identidade = resultado.rows[0];

  if (
    !identidade?.projeto_id ||
    !identidade.branch_id ||
    !identidade.endpoint_id
  ) {
    throw new Error("A conexão não forneceu a identidade técnica do Neon.");
  }

  return {
    banco: identidade.banco,
    projetoId: identidade.projeto_id,
    branchId: identidade.branch_id,
    endpointId: identidade.endpoint_id,
    replica: identidade.replica,
  };
}

async function consultarCatalogo(cliente: Client) {
  const resultado = await cliente.query<Record<string, unknown>>(`
    SELECT 'tabela' AS objeto, schemaname AS esquema, tablename AS nome, NULL::text AS detalhe
    FROM pg_catalog.pg_tables
    WHERE schemaname IN ('public', 'drizzle')

    UNION ALL

    SELECT
      'coluna' AS objeto,
      table_schema AS esquema,
      table_name || '.' || column_name AS nome,
      concat_ws('|', ordinal_position, data_type, udt_name, is_nullable, column_default) AS detalhe
    FROM information_schema.columns
    WHERE table_schema IN ('public', 'drizzle')

    UNION ALL

    SELECT
      'restricao' AS objeto,
      namespace.nspname AS esquema,
      tabela.relname || '.' || restricao.conname AS nome,
      pg_get_constraintdef(restricao.oid, true) AS detalhe
    FROM pg_catalog.pg_constraint restricao
    JOIN pg_catalog.pg_class tabela ON tabela.oid = restricao.conrelid
    JOIN pg_catalog.pg_namespace namespace ON namespace.oid = tabela.relnamespace
    WHERE namespace.nspname IN ('public', 'drizzle')

    UNION ALL

    SELECT
      'indice' AS objeto,
      schemaname AS esquema,
      tablename || '.' || indexname AS nome,
      indexdef AS detalhe
    FROM pg_catalog.pg_indexes
    WHERE schemaname IN ('public', 'drizzle')

    ORDER BY objeto, esquema, nome, detalhe
  `);

  return resultado.rows;
}

function calcularFingerprint(catalogo: Record<string, unknown>[]) {
  return createHash("sha256")
    .update(JSON.stringify(catalogo))
    .digest("hex");
}

function resumirIdentificador(valor: string) {
  return createHash("sha256").update(valor).digest("hex").slice(0, 12);
}

function validarIdentidades({
  principal,
  cloneAdocao,
  administrativaVazio,
  endpointEsperado,
}: {
  principal: IdentidadeNeon;
  cloneAdocao: IdentidadeNeon;
  administrativaVazio: IdentidadeNeon;
  endpointEsperado: string;
}) {
  if (
    administrativaVazio.projetoId !== principal.projetoId ||
    administrativaVazio.projetoId !== cloneAdocao.projetoId
  ) {
    throw new Error("Operação recusada: o alvo pertence a outro projeto Neon.");
  }

  if (
    administrativaVazio.branchId === principal.branchId ||
    administrativaVazio.endpointId === principal.endpointId
  ) {
    throw new Error("Operação recusada: a identidade do alvo é a production.");
  }

  if (
    administrativaVazio.branchId === cloneAdocao.branchId ||
    administrativaVazio.endpointId === cloneAdocao.endpointId
  ) {
    throw new Error(
      "Operação recusada: a identidade do alvo é baseline-adocao-clone.",
    );
  }

  if (administrativaVazio.endpointId !== endpointEsperado) {
    throw new Error("Operação recusada: endpoint da sessão inesperado.");
  }

  if (
    administrativaVazio.banco !== BANCO_ADMINISTRATIVO ||
    administrativaVazio.replica
  ) {
    throw new Error("Operação recusada: conexão administrativa inadequada.");
  }
}

async function bancoVazioJaExiste(cliente: Client) {
  const resultado = await cliente.query<{ existe: boolean }>(
    `
      SELECT EXISTS(
        SELECT 1
        FROM pg_catalog.pg_database
        WHERE datname = $1
      ) AS existe
    `,
    [BANCO_VAZIO],
  );

  return resultado.rows[0]?.existe === true;
}

async function criarBancoVazio(cliente: Client) {
  // O identificador é constante e não recebe entrada externa.
  await cliente.query(`CREATE DATABASE ${BANCO_VAZIO}`);
}

async function contarTabelasAplicacao(cliente: Client) {
  const resultado = await cliente.query<{ quantidade: string }>(`
    SELECT count(*)::text AS quantidade
    FROM pg_catalog.pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  `);

  return Number(resultado.rows[0]?.quantidade ?? "0");
}

function validarProtecoesLocais() {
  const configuracao = carregarConfiguracao();
  const principalComoAlvo = {
    ...configuracao,
    urlAdministrativaVazio: configuracao.urlPrincipal,
  };
  const cloneComoAlvo = {
    ...configuracao,
    urlAdministrativaVazio: configuracao.urlCloneAdocao,
  };
  let recusouPrincipal = false;
  let recusouClone = false;

  try {
    validarConfiguracao(principalComoAlvo);
  } catch {
    recusouPrincipal = true;
  }

  try {
    validarConfiguracao(cloneComoAlvo);
  } catch {
    recusouClone = true;
  }

  if (!recusouPrincipal || !recusouClone) {
    throw new Error("Uma proteção local obrigatória não recusou o alvo.");
  }

  console.log(
    JSON.stringify(
      {
        recusouDatabaseUrlPrincipal: recusouPrincipal,
        recusouBaselineAdocaoClone: recusouClone,
        exigeMarcacaoDescartavel: true,
        exigeNomeLogicoExato: true,
        exigeEndpointExato: true,
        nenhumaConexaoRealizada: true,
      },
      null,
      2,
    ),
  );
}

async function preparar() {
  const configuracao = carregarConfiguracao();
  const principal = new Client({ connectionString: configuracao.urlPrincipal });
  const cloneAdocao = new Client({
    connectionString: configuracao.urlCloneAdocao,
  });
  const administrativaVazio = new Client({
    connectionString: configuracao.urlAdministrativaVazio,
  });

  await Promise.all([
    principal.connect(),
    cloneAdocao.connect(),
    administrativaVazio.connect(),
  ]);

  let criouBanco = false;

  try {
    await Promise.all([
      principal.query("BEGIN READ ONLY"),
      cloneAdocao.query("BEGIN READ ONLY"),
      administrativaVazio.query("BEGIN READ ONLY"),
    ]);

    const [identidadePrincipal, identidadeClone, identidadeVazio] =
      await Promise.all([
        consultarIdentidade(principal),
        consultarIdentidade(cloneAdocao),
        consultarIdentidade(administrativaVazio),
      ]);

    validarIdentidades({
      principal: identidadePrincipal,
      cloneAdocao: identidadeClone,
      administrativaVazio: identidadeVazio,
      endpointEsperado: configuracao.endpointVazioEsperado,
    });

    const [
      catalogoPrincipalAntes,
      catalogoCloneAntes,
      catalogoAdministrativoAntes,
      bancoJaExistia,
    ] = await Promise.all([
      consultarCatalogo(principal),
      consultarCatalogo(cloneAdocao),
      consultarCatalogo(administrativaVazio),
      bancoVazioJaExiste(administrativaVazio),
    ]);
    const fingerprintPrincipalAntes = calcularFingerprint(
      catalogoPrincipalAntes,
    );
    const fingerprintCloneAntes = calcularFingerprint(catalogoCloneAntes);
    const fingerprintAdministrativoAntes = calcularFingerprint(
      catalogoAdministrativoAntes,
    );

    await Promise.all([
      principal.query("COMMIT"),
      cloneAdocao.query("COMMIT"),
      administrativaVazio.query("COMMIT"),
    ]);

    if (!bancoJaExistia) {
      await criarBancoVazio(administrativaVazio);
      criouBanco = true;
    }

    const bancoVazio = new Client({
      connectionString: configuracao.urlBancoVazio,
    });
    await bancoVazio.connect();

    try {
      await Promise.all([
        principal.query("BEGIN READ ONLY"),
        cloneAdocao.query("BEGIN READ ONLY"),
        administrativaVazio.query("BEGIN READ ONLY"),
        bancoVazio.query("BEGIN READ ONLY"),
      ]);

      const [
        identidadeBancoVazio,
        catalogoPrincipalDepois,
        catalogoCloneDepois,
        catalogoAdministrativoDepois,
        quantidadeTabelasBancoVazio,
      ] = await Promise.all([
        consultarIdentidade(bancoVazio),
        consultarCatalogo(principal),
        consultarCatalogo(cloneAdocao),
        consultarCatalogo(administrativaVazio),
        contarTabelasAplicacao(bancoVazio),
      ]);

      if (
        identidadeBancoVazio.projetoId !== identidadeVazio.projetoId ||
        identidadeBancoVazio.branchId !== identidadeVazio.branchId ||
        identidadeBancoVazio.endpointId !== identidadeVazio.endpointId ||
        identidadeBancoVazio.banco !== BANCO_VAZIO
      ) {
        throw new Error("O banco vazio não pertence ao alvo validado.");
      }

      const fingerprintPrincipalDepois = calcularFingerprint(
        catalogoPrincipalDepois,
      );
      const fingerprintCloneDepois = calcularFingerprint(catalogoCloneDepois);
      const fingerprintAdministrativoDepois = calcularFingerprint(
        catalogoAdministrativoDepois,
      );

      if (
        fingerprintPrincipalAntes !== fingerprintPrincipalDepois ||
        fingerprintCloneAntes !== fingerprintCloneDepois ||
        fingerprintAdministrativoAntes !== fingerprintAdministrativoDepois
      ) {
        throw new Error(
          "Uma estrutura protegida mudou durante a preparação do banco vazio.",
        );
      }

      if (quantidadeTabelasBancoVazio !== 0) {
        throw new Error("O banco preparado contém tabelas de aplicação.");
      }

      await Promise.all([
        principal.query("COMMIT"),
        cloneAdocao.query("COMMIT"),
        administrativaVazio.query("COMMIT"),
        bancoVazio.query("COMMIT"),
      ]);

      console.log(
        JSON.stringify(
          {
            ambiente: {
              mesmoProjetoDaProduction: true,
              branchDiferenteDaProduction: true,
              endpointDiferenteDaProduction: true,
              branchDiferenteDoCloneAdocao: true,
              endpointDiferenteDoCloneAdocao: true,
              endpointDescartavelConfirmado: identidadeVazio.endpointId,
              projeto: resumirIdentificador(identidadeVazio.projetoId),
              branch: resumirIdentificador(identidadeVazio.branchId),
            },
            bancoVazio: {
              nome: BANCO_VAZIO,
              criadoNestaExecucao: criouBanco,
              acessivel: true,
              tabelasDeAplicacao: quantidadeTabelasBancoVazio,
            },
            isolamento: {
              productionInalterada: true,
              baselineAdocaoCloneInalterada: true,
              neondbDaBranchDescartavelInalterado: true,
            },
            fingerprints: {
              production: fingerprintPrincipalDepois,
              baselineAdocaoClone: fingerprintCloneDepois,
              neondbDaBranchDescartavel: fingerprintAdministrativoDepois,
            },
          },
          null,
          2,
        ),
      );
    } catch (erro) {
      await Promise.allSettled([
        principal.query("ROLLBACK"),
        cloneAdocao.query("ROLLBACK"),
        administrativaVazio.query("ROLLBACK"),
        bancoVazio.query("ROLLBACK"),
      ]);
      throw erro;
    } finally {
      await bancoVazio.end();
    }
  } finally {
    await Promise.allSettled([
      principal.end(),
      cloneAdocao.end(),
      administrativaVazio.end(),
    ]);
  }
}

if (process.argv.includes("--validar-protecoes")) {
  validarProtecoesLocais();
} else {
  preparar().catch((erro) => {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Falha desconhecida durante a preparação.";

    // Nunca imprime connection strings, objetos do driver ou credenciais.
    console.error(`[baseline-vazio] ${mensagem}`);
    process.exit(1);
  });
}
