export type CriarCheckoutCartaoStripeInput = {
  pedidoId: string;
  pagamentoId: string;
  numeroPedido: string;
  email: string;
  totalEmCentavos: number;
  quantidadeItens: number;
};

export type CheckoutCartaoStripe = {
  sessionId: string;
  url: string;
  providerResponse: unknown;
};
