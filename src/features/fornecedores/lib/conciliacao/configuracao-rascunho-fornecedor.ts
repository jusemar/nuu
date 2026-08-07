export const MODALIDADES_COMERCIAIS_RASCUNHO = [
  "stock",
  "pre_sale",
  "dropshipping",
  "order_basis",
] as const;

export type ModalidadeComercialRascunho =
  (typeof MODALIDADES_COMERCIAIS_RASCUNHO)[number];

export type ConfiguracaoComercialRascunhoFornecedor = {
  modalidade: ModalidadeComercialRascunho | null;
  prazoEntrega: {
    estrategia: "valor_padrao_todos" | "conciliacao" | "rascunho" | "ignorar";
    valorPadraoTexto?: string;
  };
};

export type DadosAvaliacaoRascunhoFornecedor = {
  nome: string;
  categoriaId: string | null;
  marcaId: string | null;
  precoLoja: string | null;
  dadosOrigemJson: unknown;
};

const SECOES_LOJA_VALIDAS = new Set([
  "general",
  "new",
  "sale",
  "featured",
  "bestseller",
]);

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

export function extrairSecoesLojaRascunhoFornecedor(valor: unknown) {
  if (!ehRegistro(valor)) return [];

  const produtoRascunho = ehRegistro(valor.produtoRascunho)
    ? valor.produtoRascunho
    : null;
  const secoes = Array.isArray(valor.secoesLoja)
    ? valor.secoesLoja
    : produtoRascunho?.storeProductFlags;

  if (!Array.isArray(secoes)) return [];

  return Array.from(
    new Set(
      secoes.filter(
        (secao): secao is string =>
          typeof secao === "string" && SECOES_LOJA_VALIDAS.has(secao),
      ),
    ),
  );
}

export function extrairConfiguracaoComercialRascunhoFornecedor(
  valor: unknown,
): ConfiguracaoComercialRascunhoFornecedor {
  const padrao: ConfiguracaoComercialRascunhoFornecedor = {
    modalidade: null,
    prazoEntrega: { estrategia: "conciliacao" },
  };

  if (!ehRegistro(valor) || !ehRegistro(valor.configuracaoComercial)) {
    return padrao;
  }

  const configuracao = valor.configuracaoComercial;
  const modalidade = configuracao.modalidade;
  const prazo = configuracao.prazoEntrega;
  const modalidadeValida =
    typeof modalidade === "string" &&
    MODALIDADES_COMERCIAIS_RASCUNHO.includes(
      modalidade as ModalidadeComercialRascunho,
    )
      ? (modalidade as ModalidadeComercialRascunho)
      : null;

  if (!ehRegistro(prazo)) {
    return { ...padrao, modalidade: modalidadeValida };
  }

  const estrategias = [
    "valor_padrao_todos",
    "conciliacao",
    "rascunho",
    "ignorar",
  ] as const;
  const estrategia =
    typeof prazo.estrategia === "string" &&
    estrategias.includes(prazo.estrategia as (typeof estrategias)[number])
      ? (prazo.estrategia as (typeof estrategias)[number])
      : "conciliacao";
  const valorPadraoTexto =
    typeof prazo.valorPadraoTexto === "string" && prazo.valorPadraoTexto.trim()
      ? prazo.valorPadraoTexto.trim()
      : undefined;

  return {
    modalidade: modalidadeValida,
    prazoEntrega: { estrategia, valorPadraoTexto },
  };
}

export function mesclarDadosComerciaisRascunhoFornecedor({
  dadosOrigemJson,
  modalidade,
  prazoEntrega,
  secoesLoja,
}: {
  dadosOrigemJson: unknown;
  modalidade?: ModalidadeComercialRascunho;
  prazoEntrega?: string;
  secoesLoja?: string[];
}) {
  const dados = ehRegistro(dadosOrigemJson) ? dadosOrigemJson : {};
  const configuracaoAtual =
    extrairConfiguracaoComercialRascunhoFornecedor(dadosOrigemJson);

  return {
    ...dados,
    ...(secoesLoja ? { secoesLoja } : {}),
    configuracaoComercial: {
      modalidade: modalidade ?? configuracaoAtual.modalidade,
      prazoEntrega: {
        estrategia: prazoEntrega
          ? "valor_padrao_todos"
          : configuracaoAtual.prazoEntrega.estrategia,
        ...(prazoEntrega
          ? { valorPadraoTexto: prazoEntrega.trim() }
          : configuracaoAtual.prazoEntrega.valorPadraoTexto
            ? {
                valorPadraoTexto:
                  configuracaoAtual.prazoEntrega.valorPadraoTexto,
              }
            : {}),
      },
    },
  };
}

export function listarPendenciasRascunhoFornecedor(
  rascunho: DadosAvaliacaoRascunhoFornecedor,
) {
  const configuracao = extrairConfiguracaoComercialRascunhoFornecedor(
    rascunho.dadosOrigemJson,
  );
  const secoes = extrairSecoesLojaRascunhoFornecedor(rascunho.dadosOrigemJson);
  const preco = Number(rascunho.precoLoja);
  const pendencias: string[] = [];

  if (!rascunho.nome.trim()) pendencias.push("Falta nome do produto");
  if (!rascunho.categoriaId) pendencias.push("Falta categoria");
  if (!rascunho.marcaId) pendencias.push("Falta marca");
  if (!Number.isFinite(preco) || preco <= 0) {
    pendencias.push("Falta preço da loja");
  }
  if (secoes.length === 0) pendencias.push("Falta seção da loja");
  if (!configuracao.modalidade) {
    pendencias.push("Falta modalidade comercial");
  }
  if (
    configuracao.prazoEntrega.estrategia !== "ignorar" &&
    !configuracao.prazoEntrega.valorPadraoTexto
  ) {
    pendencias.push("Falta prazo de entrega");
  }

  return pendencias;
}

/**
 * Pendências de um rascunho "atualizar produto existente": não precisa de
 * categoria/marca/seção/modalidade (o produto real já tem tudo isso), só do
 * preço final a aplicar.
 */
export function listarPendenciasAtualizacaoRascunhoFornecedor(
  precoLoja: string | null,
) {
  const preco = Number(precoLoja);

  return !Number.isFinite(preco) || preco <= 0
    ? ["Falta preço para aplicar a atualização"]
    : [];
}
