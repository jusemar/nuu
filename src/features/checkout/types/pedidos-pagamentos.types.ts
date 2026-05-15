export type PedidoStatusCheckout = "pending" | "paid" | "canceled" | "expired";

export type PagamentoStatusCheckout = "pending" | "paid" | "failed" | "expired";

export type PagamentoGatewayCheckout = "stripe" | "efibank";

export type PagamentoMetodoCheckout = "cartao" | "pix";

export type ClienteCheckout = {
  id: string;
  userId: string | null;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  createdAt: Date;
  updatedAt: Date;
};

export type EnderecoCheckout = {
  id: string;
  clienteId: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PedidoCheckout = {
  id: string;
  numeroPedido: string;
  clienteId: string;
  enderecoId: string;
  status: PedidoStatusCheckout;
  subtotalEmCentavos: number;
  freteEmCentavos: number;
  descontoEmCentavos: number;
  totalEmCentavos: number;
  gatewayPagamento: PagamentoGatewayCheckout;
  pagamentoStatus: PagamentoStatusCheckout;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PedidoItemCheckout = {
  id: string;
  pedidoId: string;
  produtoId: string;
  nomeProduto: string;
  skuProduto: string | null;
  modalidade: string | null;
  prazoModalidade: string | null;
  imagemUrl: string | null;
  quantidade: number;
  precoUnitarioEmCentavos: number;
  totalEmCentavos: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PagamentoCheckout = {
  id: string;
  pedidoId: string;
  gateway: PagamentoGatewayCheckout;
  metodo: PagamentoMetodoCheckout;
  status: PagamentoStatusCheckout;
  valorEmCentavos: number;
  transactionId: string | null;
  pixTxid: string | null;
  qrCode: string | null;
  copiaECola: string | null;
  providerResponse: unknown | null;
  expiresAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
