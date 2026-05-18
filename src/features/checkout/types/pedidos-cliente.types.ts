import type {
  PagamentoMetodoCheckout,
  PagamentoStatusCheckout,
  PedidoHistoricoOrigemCheckout,
  PedidoHistoricoTipoCheckout,
  PedidoStatusCheckout,
} from "./pedidos-pagamentos.types";

export type PedidoClienteListaItem = {
  id: string;
  numeroPedido: string;
  createdAt: Date;
  status: PedidoStatusCheckout;
  pagamentoStatus: PagamentoStatusCheckout;
  totalEmCentavos: number;
  metodoPagamento: PagamentoMetodoCheckout | null;
};

export type PedidoClienteDetalhe = {
  id: string;
  numeroPedido: string;
  createdAt: Date;
  status: PedidoStatusCheckout;
  pagamentoStatus: PagamentoStatusCheckout;
  subtotalEmCentavos: number;
  freteEmCentavos: number;
  descontoEmCentavos: number;
  totalEmCentavos: number;
  itens: {
    id: string;
    nomeProduto: string;
    skuProduto: string | null;
    modalidade: string | null;
    prazoModalidade: string | null;
    imagemUrl: string | null;
    quantidade: number;
    precoUnitarioEmCentavos: number;
    totalEmCentavos: number;
  }[];
  pagamento: {
    metodo: PagamentoMetodoCheckout;
    status: PagamentoStatusCheckout;
  } | null;
  logistica: {
    transportadora: string | null;
    codigoRastreio: string | null;
    dataEnvio: Date | null;
    dataEntrega: Date | null;
  } | null;
  historicos: {
    id: string;
    tipo: PedidoHistoricoTipoCheckout;
    descricao: string;
    origem: PedidoHistoricoOrigemCheckout;
    statusNovo: PedidoStatusCheckout | null;
    createdAt: Date;
  }[];
};
