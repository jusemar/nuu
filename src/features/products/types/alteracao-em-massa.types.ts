export type DensidadeTabelaProdutos = "confortavel" | "compacta";

export type StatusFiltroProduto = "ativo" | "inativo";

export type TipoProdutoConfiavel = "simple" | "variable";

export type ProdutoAlteracaoEmMassa = {
  id: string;
  nome: string;
  sku: string;
  ativo: boolean;
  categoriaId: string;
  categoriaNome: string;
  marcaId: string;
  marcaNome: string;
  secoesLoja: string[];
  tipoProduto: string;
  atualizadoEm: Date;
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

export type DadosAlteracaoEmMassa = {
  produtos: ProdutoAlteracaoEmMassa[];
  categorias: CategoriaAlteracaoEmMassa[];
  marcas: MarcaAlteracaoEmMassa[];
};

export type ResultadoAlteracaoEmMassa =
  | { sucesso: true; dados: DadosAlteracaoEmMassa }
  | { sucesso: false; erro: string; dados: DadosAlteracaoEmMassa };
