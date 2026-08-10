import type {
  ProdutoRascunhoFornecedorPreparado,
  ProdutoRecebidoFornecedor,
  ValoresPreparacaoRascunhoFornecedor,
} from "../../types/produto-recebido-fornecedor.types";
import { listarPendenciasRascunhoFornecedor } from "../conciliacao/configuracao-rascunho-fornecedor";

const SECOES_LOJA_VALIDAS = new Set([
  "general",
  "new",
  "sale",
  "featured",
  "bestseller",
]);

function normalizarTexto(valor: string | null | undefined) {
  const texto = valor?.trim();
  return texto ? texto : null;
}

function normalizarPreco(valor: string | null | undefined) {
  if (!valor) return null;

  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero.toFixed(2) : null;
}

function normalizarSecoes(secoes: string[] | undefined) {
  return Array.from(
    new Set((secoes ?? []).filter((secao) => SECOES_LOJA_VALIDAS.has(secao))),
  );
}

function obterDadosOrigem(
  item: ProdutoRecebidoFornecedor,
  valores: ValoresPreparacaoRascunhoFornecedor,
) {
  const secoesLoja = normalizarSecoes(valores.secoesLoja);

  return {
    ...item.dadosOrigemJson,
    origemFluxoFornecedor: {
      tipo: item.origem.tipo,
      ...(item.origem.tipo === "arquivo_excel"
        ? {
            importacaoId: item.origem.importacaoId,
            stagingId: item.origem.stagingId,
          }
        : {
            provedor: item.origem.provedor,
            integracaoApiId: item.origem.integracaoApiId,
          }),
    },
    classificacaoOrigem: item.classificacaoOrigem,
    errosOrigem: item.erros,
    secoesLoja,
    configuracaoComercial: valores.configuracaoComercial ?? {
      modalidade: null,
      prazoEntrega: { estrategia: "conciliacao" },
    },
  };
}

/**
 * Prepara o registro universal de rascunho. A persistência permanece a cargo
 * de uma Server Action específica da origem, criada somente em fase posterior.
 */
export function prepararRascunhoProdutoRecebidoFornecedor(
  item: ProdutoRecebidoFornecedor,
  valores: ValoresPreparacaoRascunhoFornecedor = {},
): ProdutoRascunhoFornecedorPreparado {
  const codigoFornecedor = normalizarTexto(item.origem.codigoFornecedor);
  const nome = item.nome.trim();

  if (!codigoFornecedor) {
    throw new Error("Código do fornecedor é obrigatório para criar rascunho.");
  }

  if (!nome) {
    throw new Error("Nome do produto é obrigatório para criar rascunho.");
  }

  const precoFornecedor = normalizarPreco(item.precoFornecedor);
  const precoLoja = normalizarPreco(
    valores.precoLoja ?? item.precoCalculado ?? item.precoFornecedor,
  );
  const dadosOrigemJson = obterDadosOrigem(item, valores);
  const baseAvaliacao = {
    nome,
    categoriaId: valores.categoriaId ?? null,
    marcaId: valores.marcaId ?? null,
    precoLoja,
    dadosOrigemJson,
  };
  const pendencias = listarPendenciasRascunhoFornecedor(baseAvaliacao);

  return {
    origemTipo:
      item.origem.tipo === "api" ? "fornecedor_api" : "fornecedor_excel",
    origemProvedor:
      item.origem.tipo === "api" ? item.origem.provedor : "arquivo_excel",
    fornecedorId: item.origem.fornecedorId,
    integracaoApiId:
      item.origem.tipo === "api" ? item.origem.integracaoApiId : null,
    codigoFornecedor,
    nome,
    descricao: normalizarTexto(item.descricao),
    categoriaId: valores.categoriaId ?? null,
    marcaId: valores.marcaId ?? null,
    ean: normalizarTexto(item.ean),
    ncm: normalizarTexto(item.ncm),
    precoFornecedor,
    precoLoja,
    estoqueFornecedor: item.estoqueFornecedor,
    peso: normalizarTexto(item.peso),
    altura: normalizarTexto(item.altura),
    largura: normalizarTexto(item.largura),
    comprimento: normalizarTexto(item.comprimento),
    imagens: [...item.imagens],
    dadosOrigemJson,
    status:
      pendencias.length === 0 ? "pronto_para_publicar" : "pendente_conciliacao",
    pendencias,
  };
}
