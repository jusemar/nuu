import { METODOS_LAQUILA } from "../constants";
import type { ConfiguracaoLaquilaSegura } from "../types/laquila.types";

export type ClienteLaquila = {
  configuracao: ConfiguracaoLaquilaSegura;
  timeoutMs: number;
};

export type RespostaLaquilaJson = Record<string, unknown>;

export type ResultadoChamadaLaquila =
  | {
      sucesso: true;
      codigoHttp: number;
      dados: RespostaLaquilaJson;
    }
  | {
      sucesso: false;
      codigoHttp: number | null;
      erro: string;
      dados?: RespostaLaquilaJson;
      diagnostico?: DiagnosticoChamadaLaquila;
    };

type CorpoTesteTransportadorasLaquila = {
  filtro: {
    token: string;
    cnpj_empresa: string;
    cd_transportador: string;
    cnpj_transportador: string;
  };
};

type CorpoConsultarProdutosLaquila = {
  filtro: {
    token: string;
    cnpj_empresa: string;
    pagina: string;
    itensporpagina: string;
    cd_item: string;
    ds_item: string;
    ds_ggrupo: string;
    ds_grupo: string;
    ds_sgrupo: string;
    ds_marca: string;
  };
};

type CorpoConsultarSaldoPrecoLaquila = {
  filtro: {
    token: string;
    cnpj_empresa: string;
    pagina: string;
    itensporpagina: string;
    cd_item: string;
  };
};

export type ItemProdutoLaquilaApi = Record<string, unknown>;
export type ItemSaldoPrecoLaquilaApi = Record<string, unknown>;

export type ResultadoConsultarProdutosLaquila =
  | {
      sucesso: true;
      codigoHttp: number;
      itens: ItemProdutoLaquilaApi[];
      pagina: number;
      itensPorPagina: number;
      dados: RespostaLaquilaJson;
    }
  | {
      sucesso: false;
      codigoHttp: number | null;
      erro: string;
      pagina: number;
      itensPorPagina: number;
      dados?: RespostaLaquilaJson;
      diagnostico?: DiagnosticoChamadaLaquila;
    };

export type ResultadoConsultarSaldoPrecoLaquila =
  | {
      sucesso: true;
      codigoHttp: number;
      itens: ItemSaldoPrecoLaquilaApi[];
      pagina: number;
      itensPorPagina: number;
      dados: RespostaLaquilaJson;
    }
  | {
      sucesso: false;
      codigoHttp: number | null;
      erro: string;
      pagina: number;
      itensPorPagina: number;
      dados?: RespostaLaquilaJson;
      diagnostico?: DiagnosticoChamadaLaquila;
    };

type DiagnosticoChamadaLaquila = {
  tipo: "url_ausente" | "http" | "timeout" | "json_invalido" | "rede";
  url?: string;
  metodo?: string;
  codigoHttp?: number | null;
  causa?: string;
  codigoErro?: string;
};

const TIMEOUT_PADRAO_MS = 15000;
export const TIMEOUT_TESTE_CONEXAO_LAQUILA_MS = 30000;

export function criarClienteLaquila(
  configuracao: ConfiguracaoLaquilaSegura,
  timeoutMs = TIMEOUT_PADRAO_MS,
): ClienteLaquila {
  return {
    configuracao,
    timeoutMs,
  };
}

function montarUrlLaquila(urlBase: string, metodo: string) {
  const urlNormalizada = urlBase.trim();
  const urlComMetodo = urlNormalizada
    .replace(/\{m[eé]todo\}/gi, metodo)
    .replace(/M[ÉE]TODO/gi, metodo);

  if (urlComMetodo !== urlNormalizada || /\/\d{5}\/?$/u.test(urlComMetodo)) {
    return urlComMetodo;
  }

  return `${urlComMetodo.replace(/\/+$/u, "")}/${metodo}`;
}

function mascararUrlLaquila(url: string) {
  try {
    const urlApi = new URL(url);
    const partes = urlApi.pathname.split("/").filter(Boolean);
    const indiceMetodo = partes.findIndex((parte) => /^\d{5}$/u.test(parte));

    if (indiceMetodo > 0) {
      partes[indiceMetodo - 1] = "[token-rota]";
      urlApi.pathname = `/${partes.join("/")}`;
      return urlApi.toString();
    }
  } catch {
    return url;
  }

  return url;
}

function obterUrlBaseLaquila(configuracao: ConfiguracaoLaquilaSegura) {
  if (configuracao.urlBase?.trim()) {
    return configuracao.urlBase.trim();
  }

  return null;
}

function mensagemUrlBaseAusente() {
  return "Configure o endpoint da API Laquila conforme a documentação nova antes de testar a conexão.";
}

function obterMensagemErroApi(dados: RespostaLaquilaJson) {
  const erro = dados.erro ?? dados.mensagem ?? dados.message;

  if (typeof erro === "string" && erro.trim()) {
    return erro.trim();
  }

  return null;
}

function mensagemErroHttp(codigoHttp: number, dados: RespostaLaquilaJson) {
  const mensagemApi = obterMensagemErroApi(dados);

  if (mensagemApi) {
    if (mensagemApi.toUpperCase().includes("EMPRESA NÃO ENCONTRADA")) {
      return "CNPJ da empresa não encontrado na API Laquila para este token.";
    }

    return mensagemApi;
  }

  if (codigoHttp === 401 || codigoHttp === 403) {
    return "A API Laquila recusou as credenciais informadas.";
  }

  if (codigoHttp >= 500) {
    return "A API Laquila retornou uma instabilidade temporária.";
  }

  return "A API Laquila retornou uma resposta inesperada.";
}

async function lerJsonSeguro(resposta: Response): Promise<RespostaLaquilaJson> {
  const texto = await resposta.text();

  if (!texto.trim()) return {};

  try {
    const json: unknown = JSON.parse(texto);

    if (json && typeof json === "object" && !Array.isArray(json)) {
      return json as RespostaLaquilaJson;
    }

    return { resultado: json === null ? null : String(json) };
  } catch {
    throw new Error("A API Laquila retornou um JSON inválido.");
  }
}

function obterDiagnosticoErroRede(
  erro: unknown,
): Pick<DiagnosticoChamadaLaquila, "causa" | "codigoErro"> {
  if (!(erro instanceof Error)) {
    return {
      causa: "Erro desconhecido.",
    };
  }

  const erroComCausa = erro as Error & {
    cause?: {
      message?: string;
      code?: string;
      errno?: string;
    };
  };

  return {
    causa: erroComCausa.cause?.message ?? erro.message,
    codigoErro: erroComCausa.cause?.code ?? erroComCausa.cause?.errno,
  };
}

function obterMensagemErroRede(codigoErro?: string) {
  if (codigoErro === "ECONNREFUSED") {
    return "A URL configurada recusou a conexão com a API Laquila.";
  }

  if (codigoErro === "ENOTFOUND") {
    return "Não foi possível resolver o endereço da API Laquila.";
  }

  if (codigoErro === "ETIMEDOUT" || codigoErro === "UND_ERR_CONNECT_TIMEOUT") {
    return "Tempo limite excedido ao conectar na API Laquila.";
  }

  return "Falha de rede ao comunicar com a API Laquila.";
}

async function executarComRetryLaquila<T>(operacao: () => Promise<T>) {
  const resultado = await operacao();

  if (
    typeof resultado === "object" &&
    resultado &&
    "sucesso" in resultado &&
    resultado.sucesso === false &&
    "diagnostico" in resultado &&
    resultado.diagnostico &&
    typeof resultado.diagnostico === "object" &&
    "codigoErro" in resultado.diagnostico &&
    (resultado.diagnostico.codigoErro === "ETIMEDOUT" ||
      resultado.diagnostico.codigoErro === "UND_ERR_CONNECT_TIMEOUT")
  ) {
    return operacao();
  }

  return resultado;
}

export async function chamarLaquila(
  cliente: ClienteLaquila,
  metodo: string,
  corpo:
    | CorpoTesteTransportadorasLaquila
    | CorpoConsultarProdutosLaquila
    | CorpoConsultarSaldoPrecoLaquila,
): Promise<ResultadoChamadaLaquila> {
  const urlBase = obterUrlBaseLaquila(cliente.configuracao);

  if (!urlBase) {
    return {
      sucesso: false,
      codigoHttp: null,
      erro: mensagemUrlBaseAusente(),
      diagnostico: {
        tipo: "url_ausente",
        metodo,
        codigoHttp: null,
      },
    };
  }

  const urlFinal = montarUrlLaquila(urlBase, metodo);
  const urlMascarada = mascararUrlLaquila(urlFinal);
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), cliente.timeoutMs);

  async function executarFetch(): Promise<ResultadoChamadaLaquila> {
    const resposta = await fetch(urlFinal, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(corpo),
      signal: controlador.signal,
    });

    const dados = await lerJsonSeguro(resposta);

    if (!resposta.ok) {
      const diagnostico: DiagnosticoChamadaLaquila = {
        tipo: "http",
        url: urlMascarada,
        metodo,
        codigoHttp: resposta.status,
      };

      console.error("[laquila:chamada:http]", diagnostico);

      return {
        sucesso: false,
        codigoHttp: resposta.status,
        erro: mensagemErroHttp(resposta.status, dados),
        dados,
        diagnostico,
      };
    }

    return {
      sucesso: true,
      codigoHttp: resposta.status,
      dados,
    };
  }

  try {
    return await executarComRetryLaquila(executarFetch);
  } catch (erro) {
    if (erro instanceof Error && erro.name === "AbortError") {
      const diagnostico: DiagnosticoChamadaLaquila = {
        tipo: "timeout",
        url: urlMascarada,
        metodo,
        codigoHttp: null,
        causa: erro.message,
      };

      console.error("[laquila:chamada:timeout]", diagnostico);

      return {
        sucesso: false,
        codigoHttp: null,
        erro: "Tempo limite excedido ao conectar na API Laquila.",
        diagnostico,
      };
    }

    const diagnosticoErroRede = obterDiagnosticoErroRede(erro);
    const diagnostico: DiagnosticoChamadaLaquila = {
      tipo:
        erro instanceof Error &&
        erro.message === "A API Laquila retornou um JSON inválido."
          ? "json_invalido"
          : "rede",
      url: urlMascarada,
      metodo,
      codigoHttp: null,
      ...diagnosticoErroRede,
    };

    console.error("[laquila:chamada:erro]", diagnostico);

    return {
      sucesso: false,
      codigoHttp: null,
      erro:
        diagnostico.tipo === "json_invalido"
          ? "A API Laquila retornou um JSON inválido."
          : obterMensagemErroRede(diagnosticoErroRede.codigoErro),
      diagnostico,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function testarConexaoTransportadorasLaquila({
  cliente,
  tokenCliente,
}: {
  cliente: ClienteLaquila;
  tokenCliente: string;
}) {
  return chamarLaquila(
    cliente,
    METODOS_LAQUILA.retornarTransportadoras,
    {
      filtro: {
        token: tokenCliente,
        cnpj_empresa: cliente.configuracao.cnpjEmpresa,
        cd_transportador: "",
        cnpj_transportador: "",
      },
    },
  );
}

function extrairItensLaquila(
  dados: RespostaLaquilaJson,
): Record<string, unknown>[] {
  const resultados = dados.resultados;

  if (!resultados || typeof resultados !== "object") {
    return [];
  }

  const itens = (resultados as Record<string, unknown>).itens;

  if (!Array.isArray(itens)) {
    return [];
  }

  return itens.flatMap((registro) => {
    if (!registro || typeof registro !== "object") {
      return [];
    }

    const item = (registro as Record<string, unknown>).item;

    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    return [item as Record<string, unknown>];
  });
}

function extrairItensProdutoLaquila(
  dados: RespostaLaquilaJson,
): ItemProdutoLaquilaApi[] {
  return extrairItensLaquila(dados);
}

function extrairItensSaldoPrecoLaquila(
  dados: RespostaLaquilaJson,
): ItemSaldoPrecoLaquilaApi[] {
  return extrairItensLaquila(dados);
}

export async function consultarProdutosLaquila({
  cliente,
  tokenCliente,
  pagina,
  itensPorPagina,
}: {
  cliente: ClienteLaquila;
  tokenCliente: string;
  pagina: number;
  itensPorPagina: number;
}): Promise<ResultadoConsultarProdutosLaquila> {
  const resultado = await chamarLaquila(
    cliente,
    METODOS_LAQUILA.consultarItem,
    {
      filtro: {
        token: tokenCliente,
        cnpj_empresa: cliente.configuracao.cnpjEmpresa,
        pagina: String(pagina),
        itensporpagina: String(itensPorPagina),
        cd_item: "",
        ds_item: "",
        ds_ggrupo: "",
        ds_grupo: "",
        ds_sgrupo: "",
        ds_marca: "",
      },
    },
  );

  if (!resultado.sucesso) {
    return {
      ...resultado,
      pagina,
      itensPorPagina,
    };
  }

  return {
    sucesso: true,
    codigoHttp: resultado.codigoHttp,
    itens: extrairItensProdutoLaquila(resultado.dados),
    pagina,
    itensPorPagina,
    dados: resultado.dados,
  };
}

export async function consultarSaldoPrecoLaquila({
  cliente,
  tokenCliente,
  pagina,
  itensPorPagina,
  codigoItem = "",
}: {
  cliente: ClienteLaquila;
  tokenCliente: string;
  pagina: number;
  itensPorPagina: number;
  codigoItem?: string;
}): Promise<ResultadoConsultarSaldoPrecoLaquila> {
  const resultado = await chamarLaquila(
    cliente,
    METODOS_LAQUILA.consultarSaldo,
    {
      filtro: {
        token: tokenCliente,
        cnpj_empresa: cliente.configuracao.cnpjEmpresa,
        pagina: String(pagina),
        itensporpagina: String(itensPorPagina),
        cd_item: codigoItem,
      },
    },
  );

  if (!resultado.sucesso) {
    return {
      ...resultado,
      pagina,
      itensPorPagina,
    };
  }

  return {
    sucesso: true,
    codigoHttp: resultado.codigoHttp,
    itens: extrairItensSaldoPrecoLaquila(resultado.dados),
    pagina,
    itensPorPagina,
    dados: resultado.dados,
  };
}
