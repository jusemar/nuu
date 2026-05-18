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
  historicos: PedidoAdminHistorico[];
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
