/**
 * Origem dos dados de uma importação, no vocabulário de `produto_rascunhos`.
 *
 * Arquivo e API são apenas duas formas de AQUISIÇÃO. Depois que os dados
 * entram, as duas usam o mesmo conceito de importação — mapeamento, vinculação,
 * conciliação e publicação são idênticos. Este tipo existe só para que o código
 * compartilhado saiba qual par (`origem_tipo`, `origem_provedor`) filtrar,
 * sem precisar de uma implementação paralela por origem.
 */
export type OrigemImportacaoFornecedor = {
  origemTipo: "fornecedor_excel" | "fornecedor_api";
  origemProvedor: string;
};

/** Origem das importações que nasceram de uma planilha enviada pelo gestor. */
export const ORIGEM_IMPORTACAO_ARQUIVO: OrigemImportacaoFornecedor = {
  origemTipo: "fornecedor_excel",
  origemProvedor: "arquivo_excel",
};

/** Origem das importações que nasceram de uma sincronização da API Laquila. */
export const ORIGEM_IMPORTACAO_API_LAQUILA: OrigemImportacaoFornecedor = {
  origemTipo: "fornecedor_api",
  origemProvedor: "laquila",
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/**
 * Traduz uma linha de `importacoes_fornecedor` para a origem dos rascunhos dela.
 *
 * `tipo_arquivo` já distingue arquivo de API; o provedor da API fica em
 * `configuracao_fluxo_json.provedor`, gravado quando a sincronização começa.
 * Sem provedor conhecido, cai na Laquila — hoje é o único provedor do enum
 * `fornecedor_integracao_api_provedor`.
 */
export function origemDaImportacaoFornecedor(importacao: {
  tipoArquivo: "arquivo_excel" | "api";
  configuracaoFluxoJson?: Record<string, unknown> | null;
}): OrigemImportacaoFornecedor {
  if (importacao.tipoArquivo !== "api") return ORIGEM_IMPORTACAO_ARQUIVO;

  const configuracao = ehRegistro(importacao.configuracaoFluxoJson)
    ? importacao.configuracaoFluxoJson
    : {};
  const provedor =
    typeof configuracao.provedor === "string" && configuracao.provedor.trim()
      ? configuracao.provedor.trim()
      : ORIGEM_IMPORTACAO_API_LAQUILA.origemProvedor;

  return { origemTipo: "fornecedor_api", origemProvedor: provedor };
}
