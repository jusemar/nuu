import "server-only";

import {
  CLASSIFICACOES_RECEBIDOS_API_LAQUILA,
  METODOS_LAQUILA,
} from "../constants";
import {
  TIMEOUT_TESTE_CONEXAO_LAQUILA_MS,
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
const TIMEOUT_SALDO_PRECO_RECEBIDOS_LAQUILA_MS = 120000;
const TTL_CACHE_RECEBIDOS_LAQUILA_MS = 5 * 60 * 1000;

export type ResultadoProdutosRecebidosApiLaquila = {
  produtos: ProdutoApiStagingLaquilaCatalogo[];
  totalRetornadoApi: number;
  totalAposRecorte: number;
  totalRetornadoSaldoPrecoApi?: number;
  totalEnriquecidoComSaldoPreco?: number;
  cacheUsado?: boolean;
  cacheExpiraEm?: string;
  consultadoEm?: string;
  erro?: string;
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
      }
    | undefined;
}

function obterStoreCacheRecebidosLaquila() {
  globalThis.__cacheRecebidosApiLaquila ??= {
    valor: null,
  };

  return globalThis.__cacheRecebidosApiLaquila;
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
  },
): ResultadoProdutosRecebidosApiLaquila {
  return {
    ...resultado,
    produtos: resultado.produtos.map((produto) => ({ ...produto })),
    cacheUsado: opcoes?.cacheUsado ?? resultado.cacheUsado,
    cacheExpiraEm: opcoes?.cacheExpiraEm
      ? new Date(opcoes.cacheExpiraEm).toISOString()
      : resultado.cacheExpiraEm,
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

  return clonarResultadoRecebidosLaquila(cacheRecebidosLaquila.resultado, {
    cacheUsado: true,
    cacheExpiraEm: cacheRecebidosLaquila.expiraEm,
  });
}

function salvarCacheRecebidosLaquila(
  chave: string,
  resultado: ResultadoProdutosRecebidosApiLaquila,
) {
  const agora = Date.now();
  const expiraEm = agora + TTL_CACHE_RECEBIDOS_LAQUILA_MS;
  const storeCache = obterStoreCacheRecebidosLaquila();

  storeCache.valor = {
    chave,
    criadoEm: agora,
    expiraEm,
    resultado: clonarResultadoRecebidosLaquila(resultado, {
      cacheUsado: false,
      cacheExpiraEm: expiraEm,
    }),
  };

  console.info("[laquila:recebidos-api:cache]", {
    status: "miss",
    ttlSegundos: TTL_CACHE_RECEBIDOS_LAQUILA_MS / 1000,
    expiraEm: new Date(expiraEm).toISOString(),
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

async function consultarProdutosRecebidosPaginadosLaquila({
  cliente,
  tokenCliente,
}: {
  cliente: ReturnType<typeof criarClienteLaquila>;
  tokenCliente: string;
}) {
  const produtosRecebidos: ItemProdutoLaquilaApi[] = [];

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
        consultarProdutosLaquila({
          cliente,
          tokenCliente,
          pagina,
          itensPorPagina: ITENS_POR_PAGINA_API_LAQUILA,
        }),
      ),
    );

    for (const resultado of resultados) {
      if (!resultado.sucesso) {
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
  const cliente = criarClienteLaquila(
    configuracaoCliente,
    TIMEOUT_SALDO_PRECO_RECEBIDOS_LAQUILA_MS,
  );
  const resultado = await consultarSaldoPrecoLaquila({
    cliente,
    tokenCliente,
    pagina: 1,
    itensPorPagina: ITENS_POR_PAGINA_SALDO_PRECO_LAQUILA,
  });

  if (!resultado.sucesso) {
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

export async function listarProdutosRecebidosApiLaquila(): Promise<ResultadoProdutosRecebidosApiLaquila> {
  const configuracao = await buscarConfiguracaoLaquilaAdmin();

  if (!configuracao) {
    return {
      produtos: [],
      totalRetornadoApi: 0,
      totalAposRecorte: 0,
      erro: "Configuração Laquila não encontrada.",
    };
  }

  if (!configuracao.tokenCliente) {
    return {
      produtos: [],
      totalRetornadoApi: 0,
      totalAposRecorte: 0,
      erro: "Configure o token antes de consultar produtos recebidos.",
    };
  }

  const cliente = criarClienteLaquila(
    {
      id: configuracao.id,
      urlBase: configuracao.urlBase,
      cnpjEmpresa: configuracao.cnpjEmpresa,
      tokenClienteCriptografado: null,
    },
    TIMEOUT_TESTE_CONEXAO_LAQUILA_MS,
  );
  const configuracaoCliente = cliente.configuracao;
  const tokenCliente = configuracao.tokenCliente;
  const chaveCache = montarChaveCacheRecebidosLaquila({
    integracaoId: configuracao.id,
    urlBase: configuracao.urlBase,
    cnpjEmpresa: configuracao.cnpjEmpresa,
  });
  const resultadoEmCache = obterCacheRecebidosLaquila(chaveCache);

  if (resultadoEmCache) {
    return resultadoEmCache;
  }

  const resultadoProdutos = await consultarProdutosRecebidosPaginadosLaquila({
    cliente,
    tokenCliente,
  });

  if (!resultadoProdutos.sucesso) {
    console.info("[laquila:recebidos-api:diagnostico]", {
      totalBruto00007: resultadoProdutos.produtosRecebidos.length,
      totalAposRecorte: 0,
      totalBruto00006: 0,
      totalEnriquecidoComPrecoEstoque: 0,
      totalFinalTela: 0,
      motivo: "falha_00007",
    });

    return {
      produtos: [],
      totalRetornadoApi: resultadoProdutos.produtosRecebidos.length,
      totalAposRecorte: 0,
      erro: resultadoProdutos.erro,
    };
  }

  const produtosRecebidos = resultadoProdutos.produtosRecebidos;
  const produtosRecortados = produtosRecebidos.filter(
    produtoPertenceAoRecorteRecebidosLaquila,
  );
  const resultadoSaldosPrecos = await consultarSaldosPrecosRecebidosLaquila({
    configuracaoCliente,
    tokenCliente,
  });

  let totalEnriquecidoComSaldoPreco = 0;
  const produtos = produtosRecortados.flatMap((item) => {
    const codigoFornecedor = lerTexto(item, ["cd_item"]);
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

  const resultadoFinal = {
    produtos,
    totalRetornadoApi: produtosRecebidos.length,
    totalAposRecorte: produtosRecortados.length,
    totalRetornadoSaldoPrecoApi:
      resultadoSaldosPrecos.totalRetornadoSaldoPrecoApi,
    totalEnriquecidoComSaldoPreco,
    cacheUsado: false,
    consultadoEm: new Date().toISOString(),
    erro: resultadoSaldosPrecos.sucesso
      ? undefined
      : resultadoSaldosPrecos.erro,
  };

  if (resultadoSaldosPrecos.sucesso) {
    salvarCacheRecebidosLaquila(chaveCache, resultadoFinal);
  }

  return resultadoFinal;
}
