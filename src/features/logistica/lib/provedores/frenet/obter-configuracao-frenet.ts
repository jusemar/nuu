import type { ConfiguracaoProvedorFreteFrenet } from "../criar-provedor-frete-frenet";

const urlCotacaoFrenetPadrao = "https://api.frenet.com.br/shipping/quote";
const timeoutFrenetPadraoEmMs = 4000;

function lerTimeoutFrenet() {
  const timeoutConfigurado = Number(process.env.FRENET_TIMEOUT_EM_MS);

  if (!Number.isInteger(timeoutConfigurado) || timeoutConfigurado < 100) {
    return timeoutFrenetPadraoEmMs;
  }

  return timeoutConfigurado;
}

export function obterConfiguracaoFrenet(): ConfiguracaoProvedorFreteFrenet | null {
  if (process.env.FRENET_HABILITADO !== "true") {
    return null;
  }

  const token = process.env.FRENET_TOKEN?.trim();
  const cepOrigem = process.env.FRENET_CEP_ORIGEM?.replace(/\D/g, "");

  if (!token || cepOrigem?.length !== 8) {
    return null;
  }

  return {
    ativo: true,
    token,
    cepOrigem,
    urlCotacao:
      process.env.FRENET_URL_COTACAO?.trim() || urlCotacaoFrenetPadrao,
    timeoutEmMs: lerTimeoutFrenet(),
    ambiente: process.env.FRENET_AMBIENTE === "teste" ? "teste" : "producao",
  };
}
