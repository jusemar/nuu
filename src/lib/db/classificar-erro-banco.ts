const CODIGOS_TRANSITORIOS = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "ENETUNREACH",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_SOCKET",
]);

const MENSAGENS_TRANSITORIAS = [
  "error connecting to database",
  "fetch failed",
  "network error",
  "connection timeout",
  "connection terminated",
  "connect timeout",
];

type ErroComCausa = Error & {
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
  cause?: unknown;
};

function obterCadeiaErros(erro: unknown) {
  const cadeia: ErroComCausa[] = [];
  const visitados = new Set<unknown>();
  let atual = erro;

  while (atual instanceof Error && !visitados.has(atual)) {
    visitados.add(atual);
    cadeia.push(atual as ErroComCausa);
    atual = (atual as ErroComCausa).cause;
  }

  return cadeia;
}

export function erroEhTransitorioDeBanco(erro: unknown) {
  return obterCadeiaErros(erro).some((item) => {
    const codigo = typeof item.code === "string" ? item.code : "";
    const status = Number(item.statusCode ?? item.status);
    const mensagem = item.message.toLowerCase();

    return (
      CODIGOS_TRANSITORIOS.has(codigo) ||
      status === 408 ||
      status === 429 ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      MENSAGENS_TRANSITORIAS.some((trecho) => mensagem.includes(trecho))
    );
  });
}

/** Informações técnicas seguras: não inclui SQL, parâmetros ou identificadores. */
export function descreverErroBancoParaLog(erro: unknown) {
  const cadeia = obterCadeiaErros(erro);

  const mensagens = cadeia
    .map((item) => item.message.split("\n", 1)[0]?.slice(0, 240))
    .filter(Boolean)
    .map((mensagem) =>
      mensagem.toLowerCase().startsWith("failed query:")
        ? "Falha ao executar consulta no banco de dados"
        : mensagem,
    );

  return {
    tipos: cadeia.map((item) => item.name).filter(Boolean),
    codigos: cadeia
      .map((item) => (typeof item.code === "string" ? item.code : null))
      .filter(Boolean),
    mensagens,
    transitorio: erroEhTransitorioDeBanco(erro),
  };
}

export async function executarLeituraComRetry<T>(
  contexto: string,
  operacao: () => Promise<T>,
  esperaMs = 250,
) {
  try {
    return await operacao();
  } catch (erro) {
    if (!erroEhTransitorioDeBanco(erro)) throw erro;

    console.warn("[banco:retry-leitura]", {
      contexto,
      tentativa: 2,
      ...descreverErroBancoParaLog(erro),
    });
    await new Promise((resolve) => setTimeout(resolve, esperaMs));
    return operacao();
  }
}
