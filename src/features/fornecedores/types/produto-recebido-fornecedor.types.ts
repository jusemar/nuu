import type { ConfiguracaoComercialMapeamentoFornecedor } from "./mapeamento-fornecedor.types";

export type TipoOrigemProdutoRecebidoFornecedor = "api" | "arquivo_excel";

type OrigemComumProdutoRecebidoFornecedor = {
  tipo: TipoOrigemProdutoRecebidoFornecedor;
  fornecedorId: string;
  codigoFornecedor: string | null;
};

export type OrigemApiProdutoRecebidoFornecedor =
  OrigemComumProdutoRecebidoFornecedor & {
    tipo: "api";
    provedor: string;
    integracaoApiId: string;
  };

export type OrigemArquivoExcelProdutoRecebidoFornecedor =
  OrigemComumProdutoRecebidoFornecedor & {
    tipo: "arquivo_excel";
    importacaoId: string;
    stagingId: string;
  };

export type OrigemProdutoRecebidoFornecedor =
  | OrigemApiProdutoRecebidoFornecedor
  | OrigemArquivoExcelProdutoRecebidoFornecedor;

export type ClassificacaoOrigemProdutoFornecedor = {
  categoria?: string | null;
  marca?: string | null;
  macroGrupo?: string | null;
  grupo?: string | null;
  subgrupo?: string | null;
};

export type ErroProdutoRecebidoFornecedor = {
  codigo: string;
  mensagem: string;
  campo?: string;
};

/**
 * Contrato neutro entre uma origem externa e o fluxo de fornecedores.
 * Campos específicos permanecem em dadosOrigemJson para evitar perda de dados.
 */
export type ProdutoRecebidoFornecedor = {
  id: string;
  origem: OrigemProdutoRecebidoFornecedor;
  nome: string;
  descricao: string | null;
  ean: string | null;
  ncm: string | null;
  precoFornecedor: string | null;
  precoCalculado: string | null;
  estoqueFornecedor: number | null;
  imagens: string[];
  peso: string | null;
  altura: string | null;
  largura: string | null;
  comprimento: string | null;
  classificacaoOrigem: ClassificacaoOrigemProdutoFornecedor;
  situacaoOrigem: string;
  erros: ErroProdutoRecebidoFornecedor[];
  dadosOrigemJson: Record<string, unknown>;
};

export type AdaptadorProdutoRecebidoFornecedor<TEntrada> = (
  entrada: TEntrada,
) => ProdutoRecebidoFornecedor;

export type ValoresPreparacaoRascunhoFornecedor = {
  categoriaId?: string | null;
  marcaId?: string | null;
  precoLoja?: string | null;
  secoesLoja?: string[];
  configuracaoComercial?: ConfiguracaoComercialMapeamentoFornecedor;
};

export type ProdutoRascunhoFornecedorPreparado = {
  origemTipo: "fornecedor_api" | "fornecedor_excel";
  origemProvedor: string;
  fornecedorId: string;
  integracaoApiId: string | null;
  codigoFornecedor: string;
  nome: string;
  descricao: string | null;
  categoriaId: string | null;
  marcaId: string | null;
  ean: string | null;
  ncm: string | null;
  precoFornecedor: string | null;
  precoLoja: string | null;
  estoqueFornecedor: number | null;
  peso: string | null;
  altura: string | null;
  largura: string | null;
  comprimento: string | null;
  imagens: string[];
  dadosOrigemJson: Record<string, unknown>;
  status: "pendente_conciliacao" | "pronto_para_publicar";
  pendencias: string[];
};
