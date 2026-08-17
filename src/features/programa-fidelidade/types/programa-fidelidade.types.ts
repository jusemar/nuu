export type CategoriaFidelidade = {
  id: string;
  nome: string;
  grupo: string;
  produtos: number;
  ativa: boolean;
  pontosUltimos30Dias: number;
};

export type RegraCategoriaFidelidade = {
  categoriaId: string;
  personalizada: boolean;
  pontosPorReal: number;
  ativa: boolean;
};

export type ConfiguracaoFidelidade = {
  ativo: boolean;
  nomePublico: string;
  pontosPorReal: number;
  pontosConversao: number;
  valorCredito: number;
  minimoResgate: number;
  mesesValidade: number;
};

export type EstadoProgramaFidelidade = {
  configuracao: ConfiguracaoFidelidade;
  regras: RegraCategoriaFidelidade[];
  versao: number;
};
