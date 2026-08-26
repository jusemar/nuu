import { classificarRecuperacaoEmail } from "./classificar-recuperacao-email";

type DadosEnvioRecuperacao = {
  administrador: boolean;
  destinatario: string;
  emailTecnico: boolean;
  origemPermitida: string;
  urlRedefinicao: string;
};

type DependenciasEnvioRecuperacao = {
  enviarAdmin: (dados: {
    destinatario: string;
    urlRedefinicao: string;
  }) => Promise<void>;
  enviarCliente: (dados: {
    destinatario: string;
    urlRedefinicao: string;
  }) => Promise<void>;
  registrarAviso?: (evento: string) => void;
};

/**
 * Seleciona exatamente um template sem expor ao cliente se a conta existe ou
 * qual papel ela possui. O aviso não inclui e-mail, URL ou token.
 */
export async function enviarRecuperacaoEmailPorPublico(
  dados: DadosEnvioRecuperacao,
  dependencias: DependenciasEnvioRecuperacao,
) {
  const publico = classificarRecuperacaoEmail(dados);

  if (publico === "admin") {
    await dependencias.enviarAdmin({
      destinatario: dados.destinatario,
      urlRedefinicao: dados.urlRedefinicao,
    });
    return "admin" as const;
  }

  if (publico === "cliente") {
    await dependencias.enviarCliente({
      destinatario: dados.destinatario,
      urlRedefinicao: dados.urlRedefinicao,
    });
    return "cliente" as const;
  }

  dependencias.registrarAviso?.("PUBLICO_RECUPERACAO_INCOMPATIVEL");
  return null;
}
