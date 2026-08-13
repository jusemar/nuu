import { readFileSync } from "node:fs";

import { parse } from "dotenv";
import { Client } from "pg";

/**
 * Guarda central de destino de banco para scripts executados na máquina do desenvolvedor.
 *
 * Por que isto existe: `src/db/connection.ts` lê `process.env.DATABASE_URL`, e o `dotenv`
 * carrega **somente `.env`** — que guarda a URL de produção. O Next.js não tem esse problema
 * porque injeta `.env.local` no ambiente antes de avaliar qualquer módulo. Um script solto
 * (`npx tsx scripts/...`) não tem esse pré-carregamento e, sem guarda, acaba falando com
 * produção sem ninguém pedir.
 *
 * O desenho aqui é "fecha por padrão": sem `AMBIENTE_BANCO` explícito, nada roda. E a
 * validação do destino acontece **antes de qualquer conexão**, muito antes de uma transação.
 */

/**
 * Endpoint da branch `production`. Está fixo no código de propósito: é a única forma de a
 * proteção continuar valendo mesmo que alguém edite um arquivo `.env` por engano.
 */
const ENDPOINT_PRODUCAO = "ep-proud-bonus-acy2bafx";

/** Endpoints que cada ambiente pode usar. Qualquer outro é recusado. */
const ENDPOINTS_PERMITIDOS: Record<AmbienteBanco, readonly string[]> = {
  desenvolvimento: ["ep-quiet-bar-acb7yly2"],
  producao: [ENDPOINT_PRODUCAO],
};

/** De onde cada ambiente lê a URL. Nunca `.env`, que fica reservado à produção. */
const ORIGEM_DA_URL: Record<
  AmbienteBanco,
  { arquivo: string; variavel: string }
> = {
  desenvolvimento: {
    arquivo: ".env.desenvolvimento.local",
    variavel: "DATABASE_URL_DESENVOLVIMENTO",
  },
  producao: { arquivo: ".env", variavel: "DATABASE_URL" },
};

export type AmbienteBanco = "desenvolvimento" | "producao";

export type DestinoBanco = {
  ambiente: AmbienteBanco;
  url: string;
  endpoint: string;
  host: string;
};

class ErroDestinoBancoRecusado extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroDestinoBancoRecusado";
  }
}

/**
 * Extrai o identificador do endpoint Neon do hostname.
 *
 * O host tem a forma `ep-nome-1234[-pooler].regiao.aws.neon.tech`. O sufixo `-pooler` indica
 * apenas o modo de conexão, não outro banco — por isso é removido antes de comparar, senão
 * a mesma branch pareceria dois destinos diferentes.
 */
function extrairEndpoint(host: string): string {
  return (host.split(".")[0] ?? "").replace(/-pooler$/, "");
}

function lerUrlDoArquivo(arquivo: string, variavel: string): string {
  let conteudo: Buffer;

  try {
    conteudo = readFileSync(arquivo);
  } catch {
    throw new ErroDestinoBancoRecusado(
      `Arquivo de ambiente ausente: ${arquivo}. Crie-o a partir de .env.example antes de rodar scripts locais.`,
    );
  }

  const url = parse(conteudo)[variavel]?.trim();

  if (!url) {
    throw new ErroDestinoBancoRecusado(
      `${variavel} não definida em ${arquivo}.`,
    );
  }

  return url;
}

/**
 * Resolve e valida o destino **sem abrir conexão nenhuma**.
 *
 * Toda recusa acontece aqui, em cima de string: se o alvo não é permitido, o processo morre
 * antes de existir socket, sessão ou transação.
 */
export function resolverDestinoBanco(): DestinoBanco {
  const informado = process.env.AMBIENTE_BANCO?.trim();

  if (!informado) {
    throw new ErroDestinoBancoRecusado(
      "AMBIENTE_BANCO não informado. Use os comandos do package.json (ex.: `npm run seed:logistica-dados-iniciais`) — nunca `npx tsx scripts/...` direto.",
    );
  }

  if (!(informado in ENDPOINTS_PERMITIDOS)) {
    throw new ErroDestinoBancoRecusado(
      `AMBIENTE_BANCO inválido: "${informado}". Valores aceitos: desenvolvimento ou producao.`,
    );
  }

  const ambiente = informado as AmbienteBanco;
  const origem = ORIGEM_DA_URL[ambiente];
  const url = lerUrlDoArquivo(origem.arquivo, origem.variavel);

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new ErroDestinoBancoRecusado(
      `URL inválida em ${origem.arquivo} (${origem.variavel}).`,
    );
  }

  const endpoint = extrairEndpoint(host);

  // Trava dura: fora do ambiente "producao", o endpoint de produção é recusado sempre,
  // aconteça o que acontecer com os arquivos de ambiente.
  if (ambiente !== "producao" && endpoint === ENDPOINT_PRODUCAO) {
    throw new ErroDestinoBancoRecusado(
      `DESTINO RECUSADO: ${origem.arquivo} aponta para o endpoint de PRODUÇÃO (${ENDPOINT_PRODUCAO}), mas AMBIENTE_BANCO=${ambiente}. Nenhuma consulta foi executada.`,
    );
  }

  if (!ENDPOINTS_PERMITIDOS[ambiente].includes(endpoint)) {
    throw new ErroDestinoBancoRecusado(
      `DESTINO RECUSADO: endpoint "${endpoint}" não está na lista permitida para AMBIENTE_BANCO=${ambiente} (${ENDPOINTS_PERMITIDOS[ambiente].join(", ")}). Nenhuma consulta foi executada.`,
    );
  }

  return { ambiente, url, endpoint, host };
}

/** Banner que deixa o destino visível antes de qualquer escrita. */
function anunciarDestino(destino: DestinoBanco, branch: string | null) {
  const rotulo =
    destino.ambiente === "producao"
      ? "*** PRODUÇÃO ***"
      : destino.ambiente.toUpperCase();

  console.log("┌──────────────────────────────────────────────────────────");
  console.log(`│ DESTINO DO BANCO: ${rotulo}`);
  console.log(`│ endpoint : ${destino.endpoint}`);
  console.log(`│ branch   : ${branch ?? "(não informado pelo servidor)"}`);
  console.log(`│ host     : ${destino.host}`);
  console.log("└──────────────────────────────────────────────────────────");
}

/**
 * Confirma no próprio servidor que a branch/endpoint são os esperados.
 *
 * Segunda camada, e somente leitura (`BEGIN READ ONLY`): a primeira valida a string da URL,
 * esta valida o que o Postgres responde. Serve contra o caso em que a URL parece de um
 * ambiente mas o proxy entrega outro.
 */
async function confirmarIdentidadeNoServidor(
  destino: DestinoBanco,
): Promise<string | null> {
  const cliente = new Client({ connectionString: destino.url });
  await cliente.connect();

  try {
    await cliente.query("BEGIN READ ONLY");
    const resultado = await cliente.query<{
      branch: string | null;
      endpoint: string | null;
    }>(
      "SELECT current_setting($1, true) AS branch, current_setting($2, true) AS endpoint",
      ["neon.branch_id", "neon.endpoint_id"],
    );
    await cliente.query("COMMIT");

    const linha = resultado.rows[0];
    const endpointReal = linha?.endpoint ?? null;

    if (endpointReal !== null && endpointReal !== destino.endpoint) {
      throw new ErroDestinoBancoRecusado(
        `DESTINO RECUSADO: a URL aponta para "${destino.endpoint}", mas o servidor respondeu "${endpointReal}".`,
      );
    }

    return linha?.branch ?? null;
  } finally {
    await cliente.end();
  }
}

/**
 * Ponto de entrada dos scripts locais.
 *
 * Valida o destino, fixa `process.env.DATABASE_URL` e devolve o destino. Precisa rodar
 * **antes** de qualquer `import` de `@/db/connection` — por isso os scripts locais são
 * lançados por `executar-script-local.ts`, que garante essa ordem.
 */
export async function exigirBancoLocal(
  ambientesAceitos: readonly AmbienteBanco[] = ["desenvolvimento"],
): Promise<DestinoBanco> {
  const destino = resolverDestinoBanco();

  if (!ambientesAceitos.includes(destino.ambiente)) {
    throw new ErroDestinoBancoRecusado(
      `Este comando aceita apenas AMBIENTE_BANCO ${ambientesAceitos.join(" ou ")}, e recebeu "${destino.ambiente}".`,
    );
  }

  const branch = await confirmarIdentidadeNoServidor(destino);
  anunciarDestino(destino, branch);

  // Fixar aqui é o que neutraliza o `dotenv/config` de `src/db/connection.ts`: o dotenv não
  // sobrescreve variável já definida, então `.env` (produção) deixa de ser consultado.
  process.env.DATABASE_URL = destino.url;

  return destino;
}

/**
 * Ponto de entrada para operar em PRODUÇÃO — deliberadamente mais difícil de acionar.
 *
 * Exige, cumulativamente: `AMBIENTE_BANCO=producao`, a variável de autorização específica
 * com o valor exato, e confirmação da identidade do endpoint. Nunca é acionada pelos
 * comandos locais comuns: quem quiser usar precisa escrever um comando próprio.
 */
export async function exigirBancoProducao(
  operacao: string,
): Promise<DestinoBanco> {
  const destino = resolverDestinoBanco();

  if (destino.ambiente !== "producao") {
    throw new ErroDestinoBancoRecusado(
      `Operação de produção exige AMBIENTE_BANCO=producao, e recebeu "${destino.ambiente}".`,
    );
  }

  const autorizacaoEsperada = `SIM-EU-AUTORIZO-${operacao}`;
  const autorizacao = process.env.AUTORIZACAO_PRODUCAO?.trim();

  if (autorizacao !== autorizacaoEsperada) {
    throw new ErroDestinoBancoRecusado(
      `Operação de produção recusada: defina AUTORIZACAO_PRODUCAO="${autorizacaoEsperada}". Nenhuma consulta foi executada.`,
    );
  }

  const branch = await confirmarIdentidadeNoServidor(destino);
  anunciarDestino(destino, branch);
  process.env.DATABASE_URL = destino.url;

  return destino;
}

/** Formata a recusa de forma legível e encerra com código de erro. */
export function encerrarComFalhaDeDestino(erro: unknown): never {
  const mensagem =
    erro instanceof Error ? erro.message : "Falha desconhecida no destino.";

  console.error(`\n[guarda-banco] ${mensagem}\n`);
  process.exit(1);
}
