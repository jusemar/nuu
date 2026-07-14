export type ModalidadeComercialFornecedor =
  | "stock"
  | "pre_sale"
  | "dropshipping"
  | "order_basis";

export type EstrategiaPrazoEntregaFornecedor =
  | "valor_padrao_todos"
  | "conciliacao"
  | "rascunho"
  | "ignorar";

export type ConfiguracaoComercialMapeamentoFornecedor = {
  modalidade: ModalidadeComercialFornecedor;
  prazoEntrega: {
    estrategia: EstrategiaPrazoEntregaFornecedor;
    valorPadraoTexto?: string;
  };
};

export type DadosFornecedorParaRascunhoProduto = {
  id: string;
  nome: string;
  codigo?: string | null;
  ean?: string | null;
  ncm?: string | null;
  preco?: string | null;
  estoque?: number | null;
  imagens?: string[];
  pesoBruto?: string | null;
  alturaCaixa?: string | null;
  larguraCaixa?: string | null;
  comprimentoCaixa?: string | null;
  complemento?: string | null;
};

export type ValoresPadraoRascunhoProdutoFornecedor = {
  categoriaId?: string;
  categoriaNome?: string;
  marcaId?: string;
  marcaNome?: string;
  configuracaoComercial?: ConfiguracaoComercialMapeamentoFornecedor;
};
