export type MovimentoFidelidadeCliente = {
  pedidoId: string;
  numeroPedido: string;
  pontos: number;
  situacao: "pendente" | "disponivel" | "revertido";
  data: Date;
};

export type ProgramaFidelidadeCliente = {
  configuracao: {
    ativo: boolean;
    nomePublico: string;
    pontosConversao: number;
    valorCreditoEmCentavos: number;
    minimoResgate: number;
    mesesValidade: number | null;
  } | null;
  saldos: {
    disponiveis: number;
    pendentes: number;
    acumulado: number;
    revertidos: number;
    reservados: number;
    utilizados: number;
  };
  movimentos: MovimentoFidelidadeCliente[];
  paginacao: {
    pagina: number;
    porPagina: 10 | 20 | 30 | 50;
    total: number;
    totalPaginas: number;
  };
};
