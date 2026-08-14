export type CategoriaFidelidade = {
  id: string;
  nome: string;
};

export type RegraCategoriaFidelidade = {
  categoriaId: string;
  personalizada: boolean;
  valorGasto: string;
  pontos: string;
};

export type ConfiguracaoFidelidadeMock = {
  ativo: boolean;
  nomePublico: string;
  valorGastoPadrao: string;
  pontosPadrao: string;
  pontosConversao: string;
  valorCredito: string;
  minimoResgate: string;
  tipoValidade: "nao_expiram" | "expiram";
  diasValidade: string;
};
