const tabelasLogistica = [
  "provedores_frete",
  "transportadoras_frete",
  "servicos_frete",
  "regras_categorias_frete",
  "regras_produtos_frete",
  "tipos_logisticos",
  "produtos_tipos_logisticos",
  "regras_tipos_logisticos_frete",
];

function coletarMensagensErro(erro: unknown): string[] {
  const mensagens = new Set<string>();

  const visitar = (valor: unknown) => {
    if (!valor) return;

    if (valor instanceof Error) {
      if (valor.message) mensagens.add(valor.message.toLowerCase());
      const erroComCause = valor as Error & { cause?: unknown };
      if (erroComCause.cause) visitar(erroComCause.cause);
      return;
    }

    if (typeof valor === "object") {
      const possivelMensagem = (valor as { message?: unknown }).message;
      if (typeof possivelMensagem === "string") {
        mensagens.add(possivelMensagem.toLowerCase());
      }

      const possivelCode = (valor as { code?: unknown }).code;
      if (typeof possivelCode === "string") {
        mensagens.add(possivelCode.toLowerCase());
      }

      const possivelCause = (valor as { cause?: unknown }).cause;
      if (possivelCause) visitar(possivelCause);
    }
  };

  visitar(erro);
  return [...mensagens];
}

export function erroTabelaLogisticaAusente(erro: unknown) {
  const mensagensErro = coletarMensagensErro(erro);
  const semRelacao = mensagensErro.some(
    (mensagemErro) =>
      mensagemErro.includes("does not exist") ||
      mensagemErro.includes("doesn't exist"),
  );
  if (!semRelacao) return false;
  return tabelasLogistica.some((tabela) =>
    mensagensErro.some((mensagemErro) => mensagemErro.includes(tabela)),
  );
}

export function erroConexaoLogisticaIndisponivel(erro: unknown) {
  const mensagensErro = coletarMensagensErro(erro);
  return mensagensErro.some(
    (mensagemErro) =>
      mensagemErro.includes("fetch failed") ||
      mensagemErro.includes("error connecting to database") ||
      mensagemErro.includes("etimedout") ||
      mensagemErro.includes("econnreset") ||
      mensagemErro.includes("enotfound"),
  );
}
