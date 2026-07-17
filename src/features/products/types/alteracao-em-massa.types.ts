export type DensidadeTabelaProdutos = "confortavel" | "compacta";

export type StatusFiltroProduto = "ativo" | "inativo";

export type TipoProdutoConfiavel = "simple" | "variable";

export type ModalidadePrecoProduto =
  | "stock"
  | "preSale"
  | "dropshipping"
  | "orderBasis";

export type PrecoModalidadeProduto = {
  id: string;
  modalidade: ModalidadePrecoProduto;
  precoEmCentavos: number;
  prazo: string | null;
  atualizadoEm: Date;
  versaoConcorrencia: string;
};

export type ProdutoAlteracaoEmMassa = {
  id: string;
  nome: string;
  slug: string;
  sku: string;
  ativo: boolean;
  categoriaId: string;
  categoriaNome: string;
  marcaId: string;
  marcaNome: string;
  secoesLoja: string[];
  tipoProduto: string;
  ncm: string | null;
  pesoEmGramas: number | null;
  alturaEmCm: number | null;
  larguraEmCm: number | null;
  comprimentoEmCm: number | null;
  varianteTecnicaId: string | null;
  estoqueVarianteTecnica: number | null;
  varianteTecnicaAtualizadaEm: Date | null;
  varianteTecnicaVersaoConcorrencia: string | null;
  precosModalidades: PrecoModalidadeProduto[];
  classificacoesLogisticasIds: string[];
  permiteRetirada: boolean;
  permiteEntregaPropria: boolean;
  modeloRetiradaId: string | null;
  atualizadoEm: Date;
  versaoConcorrencia: string;
};

export type CategoriaAlteracaoEmMassa = {
  id: string;
  nome: string;
  parentId: string | null;
  nivel: number;
  ordem: number;
  ativa: boolean;
};

export type MarcaAlteracaoEmMassa = {
  id: string;
  nome: string;
  ativa: boolean;
};

export type ClassificacaoLogisticaAlteracaoEmMassa = {
  id: string;
  nome: string;
  descricao: string | null;
};

export type ModeloRetiradaAlteracaoEmMassa = {
  id: string;
  nome: string;
  prazoTexto: string;
  mensagem: string | null;
};

export type DadosAlteracaoEmMassa = {
  produtos: ProdutoAlteracaoEmMassa[];
  categorias: CategoriaAlteracaoEmMassa[];
  marcas: MarcaAlteracaoEmMassa[];
  classificacoesLogisticas: ClassificacaoLogisticaAlteracaoEmMassa[];
  modelosRetirada: ModeloRetiradaAlteracaoEmMassa[];
  avisos?: {
    marcas?: string;
    categorias?: string;
    classificacoesLogisticas?: string;
    modelosRetirada?: string;
  };
};

export type ResultadoAlteracaoEmMassa =
  | { sucesso: true; dados: DadosAlteracaoEmMassa }
  | { sucesso: false; erro: string; dados: DadosAlteracaoEmMassa };
