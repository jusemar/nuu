import "server-only";

import {
  CLASSIFICACOES_RECEBIDOS_API_LAQUILA,
  METODOS_LAQUILA,
} from "../constants";
import {
  consultarProdutosLaquila,
  consultarSaldoPrecoLaquila,
  criarClienteLaquila,
  type ItemProdutoLaquilaApi,
  type ItemSaldoPrecoLaquilaApi,
} from "../lib/cliente-laquila";
import { normalizarSaldosPrecosLaquila } from "../lib/normalizar-saldo-preco-laquila";
import type { ProdutoApiStagingLaquilaCatalogo } from "./listar-produtos-api-staging-laquila";
import { buscarConfiguracaoLaquilaAdmin } from "./buscar-configuracao-laquila";

const ITENS_POR_PAGINA_API_LAQUILA = 100;
const ITENS_POR_PAGINA_SALDO_PRECO_LAQUILA = 10000;
const LIMITE_PAGINAS_RECEBIDOS_LAQUILA = 120;
const TOTAL_PAGINAS_POR_LOTE_LAQUILA = 3;
const TIMEOUT_CATALOGO_RECEBIDOS_LAQUILA_MS = 30000;
const TIMEOUT_SALDO_PRECO_RECEBIDOS_LAQUILA_MS = 120000;
const TTL_CACHE_RECEBIDOS_LAQUILA_MS = 5 * 60 * 1000;
export const TIMEOUT_ATUALIZACAO_MANUAL_RECEBIDOS_LAQUILA_MS = 90 * 1000;
const MAX_TENTATIVAS_API_RECEBIDOS_LAQUILA = 3;
const ATRASO_RETRY_API_RECEBIDOS_LAQUILA_MS = 800;

export type ResultadoProdutosRecebidosApiLaquila = {
  produtos: ProdutoApiStagingLaquilaCatalogo[];
  totalRetornadoApi: number;
  totalAposRecorte: number;
  totalRetornadoSaldoPrecoApi?: number;
  totalEnriquecidoComSaldoPreco?: number;
  cacheUsado?: boolean;
  cacheExpiraEm?: string;
  consultadoEm?: string;
  tipoErro?: "configuracao" | "api";
  origemDados?: "api" | "cache" | "stale";
  avisoRecebidos?: string;
  erro?: string;
};

export type ProgressoRecebidosApiLaquila = {
  emAndamento: boolean;
  etapaAtual:
    | "preparando"
    | "catalogo"
    | "preco_estoque"
    | "recorte"
    | "concluido"
    | "erro";
  mensagem: string;
  paginaAtual?: number;
  totalPaginasEstimado?: number;
  percentual: number | null;
  totalBrutoCarregado: number;
  totalAposRecorte: number;
  totalEnriquecidoComPrecoEstoque: number;
  origemDados?: "api" | "cache_fresco" | "stale";
  atualizadoEm: string;
};

type CacheRecebidosLaquila = {
  chave: string;
  criadoEm: number;
  expiraEm: number;
  resultado: ResultadoProdutosRecebidosApiLaquila;
};

declare global {
  var __cacheRecebidosApiLaquila:
    | {
        valor: CacheRecebidosLaquila | null;
        ultimoValido: CacheRecebidosLaquila | null;
        consultas: Map<string, Promise<ResultadoProdutosRecebidosApiLaquila>>;
        progresso: ProgressoRecebidosApiLaquila;
      }
    | undefined;
}

function obterStoreCacheRecebidosLaquila() {
  globalThis.__cacheRecebidosApiLaquila ??= {
    valor: null,
    ultimoValido: null,
    consultas: new Map<string, Promise<ResultadoProdutosRecebidosApiLaquila>>(),
    progresso: criarProgressoRecebidosLaquila({
      emAndamento: false,
      etapaAtual: "concluido",
      mensagem: "Aguardando atualização.",
      percentual: 100,
    }),
  };
  globalThis.__cacheRecebidosApiLaquila.ultimoValido ??= null;
  globalThis.__cacheRecebidosApiLaquila.consultas ??= new Map<
    string,
    Promise<ResultadoProdutosRecebidosApiLaquila>
  >();
  globalThis.__cacheRecebidosApiLaquila.progresso ??=
    criarProgressoRecebidosLaquila({
      emAndamento: false,
      etapaAtual: "concluido",
      mensagem: "Aguardando atualização.",
      percentual: 100,
    });

  return globalThis.__cacheRecebidosApiLaquila;
}

function criarProgressoRecebidosLaquila(
  progresso: Partial<ProgressoRecebidosApiLaquila> &
    Pick<
      ProgressoRecebidosApiLaquila,
      "emAndamento" | "etapaAtual" | "mensagem"
    >,
): ProgressoRecebidosApiLaquila {
  return {
    paginaAtual: undefined,
    totalPaginasEstimado: undefined,
    percentual: null,
    totalBrutoCarregado: 0,
    totalAposRecorte: 0,
    totalEnriquecidoComPrecoEstoque: 0,
    atualizadoEm: new Date().toISOString(),
    ...progresso,
  };
}

function atualizarProgressoRecebidosLaquila(
  progresso: Partial<ProgressoRecebidosApiLaquila> &
    Pick<
      ProgressoRecebidosApiLaquila,
      "emAndamento" | "etapaAtual" | "mensagem"
    >,
) {
  const storeCache = obterStoreCacheRecebidosLaquila();

  storeCache.progresso = criarProgressoRecebidosLaquila({
    ...storeCache.progresso,
    ...progresso,
    atualizadoEm: new Date().toISOString(),
  });

  return storeCache.progresso;
}

export function obterProgressoRecebidosApiLaquila() {
  return obterStoreCacheRecebidosLaquila().progresso;
}

function normalizarClassificacao(valor: string | null | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

const classificacoesRecebidosPermitidas = new Set(
  CLASSIFICACOES_RECEBIDOS_API_LAQUILA.flatMap((classificacao) =>
    classificacao.subgrupos.map((subgrupo) =>
      [
        normalizarClassificacao(classificacao.macroGrupo),
        normalizarClassificacao(classificacao.grupo),
        normalizarClassificacao(subgrupo),
      ].join("|||"),
    ),
  ),
);
const assinaturaRecorteRecebidosLaquila =
  CLASSIFICACOES_RECEBIDOS_API_LAQUILA.map((classificacao) =>
    [
      normalizarClassificacao(classificacao.macroGrupo),
      normalizarClassificacao(classificacao.grupo),
      ...classificacao.subgrupos.map(normalizarClassificacao),
    ].join(":"),
  ).join("|");

function montarChaveCacheRecebidosLaquila({
  integracaoId,
  urlBase,
  cnpjEmpresa,
}: {
  integracaoId: string;
  urlBase: string | null;
  cnpjEmpresa: string;
}) {
  return [
    "laquila-recebidos-v1",
    integracaoId,
    urlBase ?? "",
    cnpjEmpresa,
    assinaturaRecorteRecebidosLaquila,
  ].join("::");
}

function clonarResultadoRecebidosLaquila(
  resultado: ResultadoProdutosRecebidosApiLaquila,
  opcoes?: {
    cacheUsado?: boolean;
    cacheExpiraEm?: number;
    origemDados?: ResultadoProdutosRecebidosApiLaquila["origemDados"];
    tipoErro?: ResultadoProdutosRecebidosApiLaquila["tipoErro"];
    erro?: string;
    avisoRecebidos?: string;
  },
): ResultadoProdutosRecebidosApiLaquila {
  return {
    ...resultado,
    produtos: resultado.produtos.map((produto) => ({ ...produto })),
    cacheUsado: opcoes?.cacheUsado ?? resultado.cacheUsado,
    cacheExpiraEm: opcoes?.cacheExpiraEm
      ? new Date(opcoes.cacheExpiraEm).toISOString()
      : resultado.cacheExpiraEm,
    origemDados: opcoes?.origemDados ?? resultado.origemDados,
    tipoErro: opcoes?.tipoErro ?? resultado.tipoErro,
    erro: opcoes?.erro ?? resultado.erro,
    avisoRecebidos: opcoes?.avisoRecebidos ?? resultado.avisoRecebidos,
  };
}

function obterCacheRecebidosLaquila(chave: string) {
  const agora = Date.now();
  const cacheRecebidosLaquila = obterStoreCacheRecebidosLaquila().valor;

  if (
    !cacheRecebidosLaquila ||
    cacheRecebidosLaquila.chave !== chave ||
    cacheRecebidosLaquila.expiraEm <= agora
  ) {
    return null;
  }

  console.info("[laquila:recebidos-api:cache]", {
    status: "hit",
    expiraEm: new Date(cacheRecebidosLaquila.expiraEm).toISOString(),
  });
  atualizarProgressoRecebidosLaquila({
    emAndamento: false,
    etapaAtual: "concluido",
    mensagem: "Dados carregados do cache temporário.",
    percentual: 100,
    totalBrutoCarregado: cacheRecebidosLaquila.resultado.totalRetornadoApi,
    totalAposRecorte: cacheRecebidosLaquila.resultado.totalAposRecorte,
    totalEnriquecidoComPrecoEstoque:
      cacheRecebidosLaquila.resultado.totalEnriquecidoComSaldoPreco ?? 0,
    origemDados: "cache_fresco",
  });

  return clonarResultadoRecebidosLaquila(cacheRecebidosLaquila.resultado, {
    cacheUsado: true,
    cacheExpiraEm: cacheRecebidosLaquila.expiraEm,
    origemDados: "cache",
  });
}

function obterUltimoResultadoValidoRecebidosLaquila({
  chave,
  tipoErro,
  erro,
}: {
  chave?: string;
  tipoErro: "configuracao" | "api";
  erro: string;
}) {
  const ultimoResultadoValido = obterStoreCacheRecebidosLaquila().ultimoValido;

  if (
    !ultimoResultadoValido ||
    (chave && ultimoResultadoValido.chave !== chave)
  ) {
    return null;
  }

  console.warn("[laquila:recebidos-api:stale]", {
    motivo: tipoErro,
    chaveCompativel: chave ? ultimoResultadoValido.chave === chave : true,
    carregadoEm: new Date(ultimoResultadoValido.criadoEm).toISOString(),
    totalFinalTela: ultimoResultadoValido.resultado.produtos.length,
  });
  atualizarProgressoRecebidosLaquila({
    emAndamento: false,
    etapaAtual: "erro",
    mensagem: "Mantendo último catálogo carregado.",
    percentual: 100,
    totalBrutoCarregado: ultimoResultadoValido.resultado.totalRetornadoApi,
    totalAposRecorte: ultimoResultadoValido.resultado.totalAposRecorte,
    totalEnriquecidoComPrecoEstoque:
      ultimoResultadoValido.resultado.totalEnriquecidoComSaldoPreco ?? 0,
    origemDados: "stale",
  });

  return clonarResultadoRecebidosLaquila(ultimoResultadoValido.resultado, {
    cacheUsado: true,
    origemDados: "stale",
    tipoErro,
    erro,
    avisoRecebidos:
      tipoErro === "api"
        ? "Não foi possível consultar a API agora. Exibindo último resultado carregado."
        : "Não foi possível acessar a configuração agora. Exibindo último resultado carregado.",
  });
}

function criarResultadoTimeoutAtualizacaoManual(timeoutGeralMs: number) {
  return new Promise<ResultadoProdutosRecebidosApiLaquila>((resolve) => {
    setTimeout(() => {
      const resultadoStale = obterUltimoResultadoValidoRecebidosLaquila({
        tipoErro: "api",
        erro: "Falha ao consultar a API Laquila.",
      });
      atualizarProgressoRecebidosLaquila({
        emAndamento: false,
        etapaAtual: "erro",
        mensagem: "Atualização demorou mais que o esperado.",
        percentual: resultadoStale ? 100 : null,
        totalBrutoCarregado: resultadoStale?.totalRetornadoApi ?? 0,
        totalAposRecorte: resultadoStale?.totalAposRecorte ?? 0,
        totalEnriquecidoComPrecoEstoque:
          resultadoStale?.totalEnriquecidoComSaldoPreco ?? 0,
        origemDados: resultadoStale ? "stale" : undefined,
      });

      if (resultadoStale) {
        resolve({
          ...resultadoStale,
          avisoRecebidos:
            "A atualização demorou mais que o esperado. Mantivemos o último catálogo carregado.",
        });
        return;
      }

      resolve({
        produtos: [],
        totalRetornadoApi: 0,
        totalAposRecorte: 0,
        tipoErro: "api",
        origemDados: "stale",
        erro: "Falha ao consultar a API Laquila.",
        avisoRecebidos:
          "A atualização demorou mais que o esperado. Tente novamente em instantes.",
        consultadoEm: new Date().toISOString(),
      });
    }, timeoutGeralMs);
  });
}

function salvarCacheRecebidosLaquila(
  chave: string,
  resultado: ResultadoProdutosRecebidosApiLaquila,
) {
  const agora = Date.now();
  const expiraEm = agora + TTL_CACHE_RECEBIDOS_LAQUILA_MS;
  const storeCache = obterStoreCacheRecebidosLaquila();

  const cache: CacheRecebidosLaquila = {
    chave,
    criadoEm: agora,
    expiraEm,
    resultado: clonarResultadoRecebidosLaquila(resultado, {
      cacheUsado: false,
      cacheExpiraEm: expiraEm,
      origemDados: "api",
    }),
  };

  storeCache.valor = cache;

  if (resultado.produtos.length > 0 && !resultado.erro) {
    storeCache.ultimoValido = cache;
  }

  console.info("[laquila:recebidos-api:cache]", {
    status: "miss",
    ttlSegundos: TTL_CACHE_RECEBIDOS_LAQUILA_MS / 1000,
    expiraEm: new Date(expiraEm).toISOString(),
  });
  atualizarProgressoRecebidosLaquila({
    emAndamento: false,
    etapaAtual: "concluido",
    mensagem: "Catálogo atualizado agora.",
    percentual: 100,
    totalBrutoCarregado: resultado.totalRetornadoApi,
    totalAposRecorte: resultado.totalAposRecorte,
    totalEnriquecidoComPrecoEstoque:
      resultado.totalEnriquecidoComSaldoPreco ?? 0,
    origemDados: "api",
  });
}

function lerTexto(item: ItemProdutoLaquilaApi, chaves: readonly string[]) {
  for (const chave of chaves) {
    const valor = item[chave];

    if (typeof valor === "string" && valor.trim()) {
      return valor.trim();
    }

    if (typeof valor === "number" && Number.isFinite(valor)) {
      return String(valor);
    }
  }

  return "";
}

function lerNumero(item: ItemProdutoLaquilaApi, chaves: readonly string[]) {
  const texto = lerTexto(item, chaves);

  if (!texto) return null;

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : null;
}

function lerInteiro(item: ItemProdutoLaquilaApi, chaves: readonly string[]) {
  const numero = lerNumero(item, chaves);

  return numero === null ? null : Math.trunc(numero);
}

function extrairPrimeiraFoto(valor: unknown) {
  if (Array.isArray(valor)) {
    return (
      valor
        .map((item) => String(item).trim())
        .find((item) => item.length > 0) ?? null
    );
  }

  if (typeof valor !== "string") return null;

  return (
    valor
      .split(/[\n,;|]+/)
      .map((item) => item.trim())
      .find((item) => item.length > 0) ?? null
  );
}

function produtoPertenceAoRecorteRecebidosLaquila(item: ItemProdutoLaquilaApi) {
  const chave = [
    normalizarClassificacao(lerTexto(item, ["ds_ggrupo"])),
    normalizarClassificacao(lerTexto(item, ["ds_grupo"])),
    normalizarClassificacao(lerTexto(item, ["ds_sgrupo"])),
  ].join("|||");

  return classificacoesRecebidosPermitidas.has(chave);
}

function calcularPercentualProgressoCatalogo(paginaAtual: number) {
  const progressoCatalogo = Math.min(
    paginaAtual / LIMITE_PAGINAS_RECEBIDOS_LAQUILA,
    1,
  );

  return Math.min(70, Math.max(5, Math.round(5 + progressoCatalogo * 65)));
}

function converterProdutoRecebidoApiLaquila(
  item: ItemProdutoLaquilaApi,
): ProdutoApiStagingLaquilaCatalogo | null {
  const codigo = lerTexto(item, ["cd_item"]);
  const nome = lerTexto(item, ["descricao", "ds_item"]);

  if (!codigo || !nome) return null;

  const grupo = lerTexto(item, ["ds_grupo"]);
  const subgrupo = lerTexto(item, ["ds_sgrupo"]);

  return {
    id: `laquila-api-${codigo}`,
    codigo,
    nome,
    marca: lerTexto(item, ["ds_marca", "marca"]) || "Sem marca",
    grupo: grupo || "Sem grupo",
    categoria: subgrupo || grupo || "API",
    ean: lerTexto(item, ["cd_ean", "ean"]) || "-",
    ncm: lerTexto(item, ["NCM", "ncm"]) || "-",
    preco: lerNumero(item, ["vl_preco", "preco", "preco_venda", "valor"]),
    estoque: lerInteiro(item, ["qt_saldo", "saldo", "estoque", "quantidade"]),
    status: "novo",
    imagemUrl:
      extrairPrimeiraFoto(item.lista_fotos) ?? "/produto-sem-foto.webp",
    recebidoEm: new Date(),
    dadosBrutosJson: item,
  };
}

function aguardarRetryApiLaquila(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resultadoApiPodeTentarNovamente(resultado: {
  sucesso: boolean;
  codigoHttp?: number | null;
  diagnostico?: {
    tipo?: string;
    codigoErro?: string;
  };
}) {
  if (resultado.sucesso) return false;

  return (
    resultado.diagnostico?.tipo === "timeout" ||
    resultado.diagnostico?.tipo === "rede" ||
    resultado.diagnostico?.codigoErro === "ETIMEDOUT" ||
    resultado.diagnostico?.codigoErro === "UND_ERR_CONNECT_TIMEOUT" ||
    resultado.codigoHttp === 500 ||
    resultado.codigoHttp === 502 ||
    resultado.codigoHttp === 503 ||
    resultado.codigoHttp === 504
  );
}

async function executarConsultaApiRecebidosComRetry<
  T extends {
    sucesso: boolean;
    codigoHttp?: number | null;
    diagnostico?: { tipo?: string; codigoErro?: string };
  },
>({
  metodo,
  pagina,
  operacao,
}: {
  metodo: string;
  pagina?: number;
  operacao: () => Promise<T>;
}) {
  let ultimoResultado: T | null = null;

  for (
    let tentativa = 1;
    tentativa <= MAX_TENTATIVAS_API_RECEBIDOS_LAQUILA;
    tentativa += 1
  ) {
    const inicio = Date.now();
    const resultado = await operacao();
    const duracaoMs = Date.now() - inicio;

    console.info("[laquila:recebidos-api:tentativa]", {
      metodo,
      pagina,
      tentativa,
      totalTentativas: MAX_TENTATIVAS_API_RECEBIDOS_LAQUILA,
      sucesso: resultado.sucesso,
      codigoHttp: resultado.codigoHttp,
      tipoErro: resultado.diagnostico?.tipo,
      codigoErro: resultado.diagnostico?.codigoErro,
      duracaoMs,
    });

    if (resultado.sucesso || !resultadoApiPodeTentarNovamente(resultado)) {
      return resultado;
    }

    ultimoResultado = resultado;

    if (tentativa < MAX_TENTATIVAS_API_RECEBIDOS_LAQUILA) {
      await aguardarRetryApiLaquila(
        ATRASO_RETRY_API_RECEBIDOS_LAQUILA_MS * tentativa,
      );
    }
  }

  return ultimoResultado!;
}

async function consultarProdutosRecebidosPaginadosLaquila({
  cliente,
  tokenCliente,
}: {
  cliente: ReturnType<typeof criarClienteLaquila>;
  tokenCliente: string;
}) {
  const produtosRecebidos: ItemProdutoLaquilaApi[] = [];

  atualizarProgressoRecebidosLaquila({
    emAndamento: true,
    etapaAtual: "catalogo",
    mensagem: "Consultando catálogo de produtos.",
    paginaAtual: 1,
    totalPaginasEstimado: LIMITE_PAGINAS_RECEBIDOS_LAQUILA,
    percentual: 5,
    totalBrutoCarregado: 0,
    totalAposRecorte: 0,
    totalEnriquecidoComPrecoEstoque: 0,
    origemDados: "api",
  });

  for (
    let paginaInicial = 1;
    paginaInicial <= LIMITE_PAGINAS_RECEBIDOS_LAQUILA;
    paginaInicial += TOTAL_PAGINAS_POR_LOTE_LAQUILA
  ) {
    const paginas = Array.from(
      { length: TOTAL_PAGINAS_POR_LOTE_LAQUILA },
      (_, indice) => paginaInicial + indice,
    ).filter((pagina) => pagina <= LIMITE_PAGINAS_RECEBIDOS_LAQUILA);
    const resultados = await Promise.all(
      paginas.map((pagina) =>
        executarConsultaApiRecebidosComRetry({
          metodo: METODOS_LAQUILA.consultarItem,
          pagina,
          operacao: () =>
            consultarProdutosLaquila({
              cliente,
              tokenCliente,
              pagina,
              itensPorPagina: ITENS_POR_PAGINA_API_LAQUILA,
            }),
        }),
      ),
    );
    const ultimaPaginaDoLote = Math.max(...paginas);

    for (const resultado of resultados) {
      if (!resultado.sucesso) {
        atualizarProgressoRecebidosLaquila({
          emAndamento: false,
          etapaAtual: "erro",
          mensagem: "Falha ao consultar catálogo de produtos.",
          paginaAtual: ultimaPaginaDoLote,
          totalPaginasEstimado: LIMITE_PAGINAS_RECEBIDOS_LAQUILA,
          percentual: calcularPercentualProgressoCatalogo(ultimaPaginaDoLote),
          totalBrutoCarregado: produtosRecebidos.length,
          totalAposRecorte: 0,
          totalEnriquecidoComPrecoEstoque: 0,
          origemDados: "stale",
        });

        return {
          sucesso: false as const,
          erro:
            resultado.erro ??
            `Não foi possível consultar produtos Laquila pelo método ${METODOS_LAQUILA.consultarItem}.`,
          produtosRecebidos,
        };
      }

      produtosRecebidos.push(...resultado.itens);
    }

    atualizarProgressoRecebidosLaquila({
      emAndamento: true,
      etapaAtual: "catalogo",
      mensagem: "Consultando catálogo de produtos.",
      paginaAtual: ultimaPaginaDoLote,
      totalPaginasEstimado: LIMITE_PAGINAS_RECEBIDOS_LAQUILA,
      percentual: calcularPercentualProgressoCatalogo(ultimaPaginaDoLote),
      totalBrutoCarregado: produtosRecebidos.length,
      totalAposRecorte: 0,
      totalEnriquecidoComPrecoEstoque: 0,
      origemDados: "api",
    });

    if (
      resultados.some(
        (resultado) =>
          resultado.sucesso &&
          resultado.itens.length < ITENS_POR_PAGINA_API_LAQUILA,
      )
    ) {
      break;
    }
  }

  return {
    sucesso: true as const,
    produtosRecebidos,
  };
}

async function consultarSaldosPrecosRecebidosLaquila({
  configuracaoCliente,
  tokenCliente,
}: {
  configuracaoCliente: Parameters<typeof criarClienteLaquila>[0];
  tokenCliente: string;
}) {
  atualizarProgressoRecebidosLaquila({
    emAndamento: true,
    etapaAtual: "preco_estoque",
    mensagem: "Consultando preço e estoque.",
    paginaAtual: 1,
    totalPaginasEstimado: 1,
    percentual: 78,
    origemDados: "api",
  });

  const cliente = criarClienteLaquila(
    configuracaoCliente,
    TIMEOUT_SALDO_PRECO_RECEBIDOS_LAQUILA_MS,
  );
  const resultado = await executarConsultaApiRecebidosComRetry({
    metodo: METODOS_LAQUILA.consultarSaldo,
    pagina: 1,
    operacao: () =>
      consultarSaldoPrecoLaquila({
        cliente,
        tokenCliente,
        pagina: 1,
        itensPorPagina: ITENS_POR_PAGINA_SALDO_PRECO_LAQUILA,
      }),
  });

  if (!resultado.sucesso) {
    atualizarProgressoRecebidosLaquila({
      emAndamento: false,
      etapaAtual: "erro",
      mensagem: "Falha ao consultar preço e estoque.",
      paginaAtual: 1,
      totalPaginasEstimado: 1,
      percentual: 78,
      origemDados: "stale",
    });

    return {
      sucesso: false as const,
      erro:
        resultado.erro ??
        `Não foi possível consultar preço e estoque pelo método ${METODOS_LAQUILA.consultarSaldo}.`,
      saldosPrecosPorCodigo: new Map<string, ItemSaldoPrecoLaquilaApi>(),
      totalRetornadoSaldoPrecoApi: 0,
    };
  }

  const itensSaldoPreco = resultado.itens;
  atualizarProgressoRecebidosLaquila({
    emAndamento: true,
    etapaAtual: "preco_estoque",
    mensagem: "Preço e estoque recebidos.",
    paginaAtual: 1,
    totalPaginasEstimado: 1,
    percentual: 88,
    origemDados: "api",
  });
  const saldosPrecosPorCodigo = new Map<string, ItemSaldoPrecoLaquilaApi>();
  const saldosPrecosBrutosPorCodigo = new Map<
    string,
    ItemSaldoPrecoLaquilaApi
  >();

  for (const item of itensSaldoPreco) {
    const codigoFornecedor = lerTexto(item, ["cd_item"]);

    if (codigoFornecedor) {
      saldosPrecosBrutosPorCodigo.set(codigoFornecedor, item);
    }
  }

  const saldosPrecosNormalizados =
    normalizarSaldosPrecosLaquila(itensSaldoPreco);

  for (const saldoPreco of saldosPrecosNormalizados) {
    const bruto = saldosPrecosBrutosPorCodigo.get(saldoPreco.codigoFornecedor);

    saldosPrecosPorCodigo.set(saldoPreco.codigoFornecedor, {
      ...(bruto ?? {}),
      cd_item: saldoPreco.codigoFornecedor,
      vl_preco: saldoPreco.precoFornecedor,
      qt_saldo: saldoPreco.estoqueFornecedor,
    });
  }

  return {
    sucesso: true as const,
    saldosPrecosPorCodigo,
    totalRetornadoSaldoPrecoApi: itensSaldoPreco.length,
  };
}

async function consultarProdutosRecebidosSemCacheLaquila({
  cliente,
  configuracaoCliente,
  tokenCliente,
  chaveCache,
}: {
  cliente: ReturnType<typeof criarClienteLaquila>;
  configuracaoCliente: Parameters<typeof criarClienteLaquila>[0];
  tokenCliente: string;
  chaveCache: string;
}): Promise<ResultadoProdutosRecebidosApiLaquila> {
  try {
    const resultadoProdutos = await consultarProdutosRecebidosPaginadosLaquila({
      cliente,
      tokenCliente,
    });

    if (!resultadoProdutos.sucesso) {
      const resultadoStale = obterUltimoResultadoValidoRecebidosLaquila({
        chave: chaveCache,
        tipoErro: "api",
        erro: "Falha ao consultar a API Laquila.",
      });

      console.info("[laquila:recebidos-api:diagnostico]", {
        origem: "falha_api",
        metodo: METODOS_LAQUILA.consultarItem,
        totalBruto00007: resultadoProdutos.produtosRecebidos.length,
        totalAposRecorte: null,
        totalBruto00006: 0,
        totalEnriquecidoComPrecoEstoque: 0,
        totalFinalTela: resultadoStale?.produtos.length ?? 0,
        motivo: "falha_00007",
        cacheStaleUsado: Boolean(resultadoStale),
      });

      if (resultadoStale) return resultadoStale;

      return {
        produtos: [],
        totalRetornadoApi: resultadoProdutos.produtosRecebidos.length,
        totalAposRecorte: 0,
        tipoErro: "api",
        erro: "Falha ao consultar a API Laquila.",
        consultadoEm: new Date().toISOString(),
      };
    }

    const produtosRecebidos = resultadoProdutos.produtosRecebidos;
    const produtosRecortados = produtosRecebidos.filter(
      produtoPertenceAoRecorteRecebidosLaquila,
    );
    atualizarProgressoRecebidosLaquila({
      emAndamento: true,
      etapaAtual: "recorte",
      mensagem: "Aplicando recorte de produtos.",
      percentual: 74,
      totalBrutoCarregado: produtosRecebidos.length,
      totalAposRecorte: produtosRecortados.length,
      totalEnriquecidoComPrecoEstoque: 0,
      origemDados: "api",
    });

    const resultadoSaldosPrecos = await consultarSaldosPrecosRecebidosLaquila({
      configuracaoCliente,
      tokenCliente,
    });

    if (!resultadoSaldosPrecos.sucesso) {
      const resultadoStale = obterUltimoResultadoValidoRecebidosLaquila({
        chave: chaveCache,
        tipoErro: "api",
        erro: "Falha ao consultar a API Laquila.",
      });

      if (resultadoStale) {
        console.info("[laquila:recebidos-api:diagnostico]", {
          origem: "catalogo_atual_saldo_preco_falhou",
          totalBruto00007: produtosRecebidos.length,
          totalAposRecorte: produtosRecortados.length,
          totalBruto00006: 0,
          totalFinalTela: resultadoStale.produtos.length,
          cacheStaleUsado: true,
        });

        return {
          ...resultadoStale,
          avisoRecebidos:
            "Preço e estoque não puderam ser atualizados agora. Exibindo último resultado carregado.",
        };
      }
    }

    let totalEnriquecidoComSaldoPreco = 0;
    atualizarProgressoRecebidosLaquila({
      emAndamento: true,
      etapaAtual: "recorte",
      mensagem: "Combinando catálogo com preço e estoque.",
      percentual: 92,
      totalBrutoCarregado: produtosRecebidos.length,
      totalAposRecorte: produtosRecortados.length,
      totalEnriquecidoComPrecoEstoque: 0,
      origemDados: "api",
    });

    const produtos = produtosRecortados.flatMap((item) => {
      const codigoFornecedor = String(lerTexto(item, ["cd_item"])).trim();
      const saldoPreco = resultadoSaldosPrecos.sucesso
        ? resultadoSaldosPrecos.saldosPrecosPorCodigo.get(codigoFornecedor)
        : undefined;

      if (
        saldoPreco &&
        (saldoPreco.vl_preco !== undefined || saldoPreco.qt_saldo !== undefined)
      ) {
        totalEnriquecidoComSaldoPreco += 1;
      }

      const produto = converterProdutoRecebidoApiLaquila({
        ...item,
        vl_preco: saldoPreco?.vl_preco ?? item.vl_preco,
        qt_saldo: saldoPreco?.qt_saldo ?? item.qt_saldo,
        sit_estoque: saldoPreco?.sit_estoque ?? item.sit_estoque,
      });

      return produto ? [produto] : [];
    });
    atualizarProgressoRecebidosLaquila({
      emAndamento: true,
      etapaAtual: "recorte",
      mensagem: "Finalizando catálogo recebido.",
      percentual: 96,
      totalBrutoCarregado: produtosRecebidos.length,
      totalAposRecorte: produtosRecortados.length,
      totalEnriquecidoComPrecoEstoque: totalEnriquecidoComSaldoPreco,
      origemDados: "api",
    });

    console.info("[laquila:recebidos-api:diagnostico]", {
      totalBruto00007: produtosRecebidos.length,
      totalAposRecorte: produtosRecortados.length,
      totalBruto00006: resultadoSaldosPrecos.totalRetornadoSaldoPrecoApi,
      totalEnriquecidoComPrecoEstoque: totalEnriquecidoComSaldoPreco,
      totalFinalTela: produtos.length,
      saldoPrecoDisponivel: resultadoSaldosPrecos.sucesso,
      erroSaldoPreco: resultadoSaldosPrecos.sucesso
        ? undefined
        : resultadoSaldosPrecos.erro,
    });

    const resultadoFinal: ResultadoProdutosRecebidosApiLaquila = {
      produtos,
      totalRetornadoApi: produtosRecebidos.length,
      totalAposRecorte: produtosRecortados.length,
      totalRetornadoSaldoPrecoApi:
        resultadoSaldosPrecos.totalRetornadoSaldoPrecoApi,
      totalEnriquecidoComSaldoPreco,
      cacheUsado: false,
      consultadoEm: new Date().toISOString(),
      origemDados: "api",
      tipoErro: resultadoSaldosPrecos.sucesso ? undefined : "api",
      erro: resultadoSaldosPrecos.sucesso
        ? undefined
        : "Falha ao consultar a API Laquila.",
    };

    if (resultadoSaldosPrecos.sucesso) {
      salvarCacheRecebidosLaquila(chaveCache, resultadoFinal);
    }

    return resultadoFinal;
  } catch (erro) {
    console.error("[laquila:recebidos-api:erro]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    const resultadoStale = obterUltimoResultadoValidoRecebidosLaquila({
      chave: chaveCache,
      tipoErro: "api",
      erro: "Falha ao consultar a API Laquila.",
    });

    if (resultadoStale) return resultadoStale;

    return {
      produtos: [],
      totalRetornadoApi: 0,
      totalAposRecorte: 0,
      tipoErro: "api",
      erro: "Falha ao consultar a API Laquila.",
      consultadoEm: new Date().toISOString(),
    };
  }
}

export async function listarProdutosRecebidosApiLaquila(
  opcoes: { ignorarCache?: boolean; timeoutGeralMs?: number } = {},
): Promise<ResultadoProdutosRecebidosApiLaquila> {
  if (opcoes.ignorarCache) {
    atualizarProgressoRecebidosLaquila({
      emAndamento: true,
      etapaAtual: "preparando",
      mensagem: "Preparando consulta da Laquila.",
      percentual: null,
      totalBrutoCarregado: 0,
      totalAposRecorte: 0,
      totalEnriquecidoComPrecoEstoque: 0,
      origemDados: "api",
    });
  }

  const configuracao = await buscarConfiguracaoLaquilaAdmin();

  if (!configuracao) {
    const resultadoStale = obterUltimoResultadoValidoRecebidosLaquila({
      tipoErro: "configuracao",
      erro: "Não foi possível carregar a configuração da Laquila.",
    });

    if (resultadoStale) return resultadoStale;
    atualizarProgressoRecebidosLaquila({
      emAndamento: false,
      etapaAtual: "erro",
      mensagem: "Configuração Laquila não encontrada.",
      percentual: null,
      totalBrutoCarregado: 0,
      totalAposRecorte: 0,
      totalEnriquecidoComPrecoEstoque: 0,
    });

    return {
      produtos: [],
      totalRetornadoApi: 0,
      totalAposRecorte: 0,
      tipoErro: "configuracao",
      erro: "Não foi possível carregar a configuração da Laquila.",
      consultadoEm: new Date().toISOString(),
    };
  }

  if (!configuracao.tokenCliente) {
    atualizarProgressoRecebidosLaquila({
      emAndamento: false,
      etapaAtual: "erro",
      mensagem: "Token da Laquila não configurado.",
      percentual: null,
      totalBrutoCarregado: 0,
      totalAposRecorte: 0,
      totalEnriquecidoComPrecoEstoque: 0,
    });

    return {
      produtos: [],
      totalRetornadoApi: 0,
      totalAposRecorte: 0,
      tipoErro: "configuracao",
      erro: "Configure o token da Laquila antes de consultar produtos recebidos.",
      consultadoEm: new Date().toISOString(),
    };
  }

  const cliente = criarClienteLaquila(
    {
      id: configuracao.id,
      urlBase: configuracao.urlBase,
      cnpjEmpresa: configuracao.cnpjEmpresa,
      tokenClienteCriptografado: null,
    },
    TIMEOUT_CATALOGO_RECEBIDOS_LAQUILA_MS,
  );
  const configuracaoCliente = cliente.configuracao;
  const tokenCliente = configuracao.tokenCliente;
  const chaveCache = montarChaveCacheRecebidosLaquila({
    integracaoId: configuracao.id,
    urlBase: configuracao.urlBase,
    cnpjEmpresa: configuracao.cnpjEmpresa,
  });
  const resultadoEmCache = opcoes.ignorarCache
    ? null
    : obterCacheRecebidosLaquila(chaveCache);

  if (resultadoEmCache) {
    return resultadoEmCache;
  }

  const storeCache = obterStoreCacheRecebidosLaquila();
  const consultaEmAndamento = storeCache.consultas.get(chaveCache);

  if (consultaEmAndamento) {
    console.info("[laquila:recebidos-api:cache]", {
      status: "aguardando_consulta_em_andamento",
      atualizacaoManual: Boolean(opcoes.ignorarCache),
    });

    const resultadoConsultaEmAndamento = consultaEmAndamento.then((resultado) =>
      clonarResultadoRecebidosLaquila(resultado),
    );

    if (!opcoes.timeoutGeralMs) {
      return await resultadoConsultaEmAndamento;
    }

    return await Promise.race([
      resultadoConsultaEmAndamento,
      criarResultadoTimeoutAtualizacaoManual(opcoes.timeoutGeralMs),
    ]);
  }

  const consulta = consultarProdutosRecebidosSemCacheLaquila({
    cliente,
    configuracaoCliente,
    tokenCliente,
    chaveCache,
  });

  storeCache.consultas.set(chaveCache, consulta);
  consulta
    .finally(() => {
      if (storeCache.consultas.get(chaveCache) === consulta) {
        storeCache.consultas.delete(chaveCache);
      }
    })
    .catch(() => undefined);

  if (!opcoes.timeoutGeralMs) {
    return await consulta;
  }

  return await Promise.race([
    consulta,
    criarResultadoTimeoutAtualizacaoManual(opcoes.timeoutGeralMs),
  ]);
}
