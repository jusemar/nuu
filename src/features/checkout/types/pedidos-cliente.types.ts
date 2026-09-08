import type {
  PagamentoGatewayCheckout,
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
  acaoPosVenda:
    | "cancelar"
    | "solicitar_cancelamento"
    | "solicitar_devolucao"
    | null;
  cancelamento: {
    status: "processando" | "concluido" | "falhou" | "bloqueado_fornecedor";
    reembolsoStatus: "nao_necessario" | "processando" | "concluido" | "falhou";
    motivo: string;
    complementoMotivo: string | null;
    solicitadoEm: Date;
    erroOperacional: string | null;
  } | null;
  subtotalEmCentavos: number;
  freteEmCentavos: number;
  descontoEmCentavos: number;
  totalEmCentavos: number;
  itens: {
    id: string;
    nomeProduto: string;
    varianteId: string | null;
    nomeVariante: string | null;
    atributosVariante: Record<string, string>;
    skuProduto: string | null;
    modalidade: string | null;
    prazoModalidade: string | null;
    imagemUrl: string | null;
    quantidade: number;
    precoUnitarioEmCentavos: number;
    totalEmCentavos: number;
  }[];
  pagamento: {
    gateway: PagamentoGatewayCheckout;
    metodo: PagamentoMetodoCheckout;
    status: PagamentoStatusCheckout;
    qrCode: string | null;
    copiaECola: string | null;
    expiresAt: Date | null;
    paidAt: Date | null;
    createdAt: Date;
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
