import type {
  PagamentoGatewayCheckout,
  PagamentoMetodoCheckout,
  PagamentoStatusCheckout,
  PedidoHistoricoOrigemCheckout,
  PedidoHistoricoTipoCheckout,
  PedidoStatusCheckout,
} from "./pedidos-pagamentos.types";

export type PedidoAdminListaItem = {
  id: string;
  numeroPedido: string;
  cliente: {
    nome: string;
    email: string;
  };
  totalEmCentavos: number;
  status: PedidoStatusCheckout;
  pagamentoStatus: PagamentoStatusCheckout;
  gateway: PagamentoGatewayCheckout;
  metodoPagamento: PagamentoMetodoCheckout | null;
  createdAt: Date;
};

export type PedidoAdminDetalhe = {
  id: string;
  numeroPedido: string;
  status: PedidoStatusCheckout;
  pagamentoStatus: PagamentoStatusCheckout;
  gateway: PagamentoGatewayCheckout;
  subtotalEmCentavos: number;
  freteEmCentavos: number;
  descontoEmCentavos: number;
  totalEmCentavos: number;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
  cliente: {
    nome: string;
    email: string;
    telefone: string;
    documento: string;
  };
  endereco: {
    cep: string;
    rua: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
    observacao: string | null;
  };
  itens: {
    id: string;
    nomeProduto: string;
    varianteId: string | null;
    nomeVariante: string | null;
    atributosVariante: Record<string, string>;
    skuProduto: string | null;
    modalidade: string | null;
    prazoModalidade: string | null;
    quantidade: number;
    precoUnitarioEmCentavos: number;
    totalEmCentavos: number;
  }[];
  pagamento: {
    id: string;
    gateway: PagamentoGatewayCheckout;
    metodo: PagamentoMetodoCheckout;
    status: PagamentoStatusCheckout;
    valorEmCentavos: number;
    transactionId: string | null;
    pixTxid: string | null;
    copiaECola: string | null;
    expiresAt: Date | null;
    paidAt: Date | null;
    providerResponse: unknown | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  logistica: PedidoAdminLogistica | null;
  /** Só existe em pedido pago na entrega. `null` significa pagamento online. */
  pagamentoNaEntrega: PedidoAdminPagamentoNaEntrega | null;
  historicos: PedidoAdminHistorico[];
};

/**
 * O que o admin precisa ver e agir num pedido pago na entrega.
 *
 * `snapshotElegibilidade` é a decisão congelada na criação — é ela que responde "por que
 * este pedido pôde ser pago na entrega", mesmo que a configuração tenha mudado depois.
 */
export type PedidoAdminPagamentoNaEntrega = {
  id: string;
  formaEscolhida: string;
  servicoIdentificador: string;
  valorAReceberEmCentavos: number;
  precisaTroco: boolean;
  trocoParaEmCentavos: number | null;
  observacoesCliente: string | null;
  /** Nulo enquanto o dinheiro não entrou. É o discriminador de "já foi dada baixa". */
  recebidoEm: Date | null;
  recebidoPorEmail: string | null;
  valorRecebidoEmCentavos: number | null;
  observacaoRecebimento: string | null;
  snapshotElegibilidade: unknown;
};

export type PedidoAdminLogistica = {
  id: string;
  transportadora: string | null;
  codigoRastreio: string | null;
  dataEnvio: Date | null;
  dataEntrega: Date | null;
  updatedAt: Date;
};

export type PedidoAdminHistorico = {
  /** E-mail do admin que executou a ação. Nulo em histórico de origem "system". */
  usuarioAdminEmail?: string | null;
  id: string;
  tipo: PedidoHistoricoTipoCheckout;
  descricao: string;
  origem: PedidoHistoricoOrigemCheckout;
  statusAnterior: PedidoStatusCheckout | null;
  statusNovo: PedidoStatusCheckout | null;
  createdAt: Date;
};

export type ResultadoListaPedidosAdmin = {
  pedidos: PedidoAdminListaItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
