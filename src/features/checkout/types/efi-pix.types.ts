export type CriarCobrancaPixEfiInput = {
  numeroPedido: string;
  nome: string;
  documento: string;
  valorEmCentavos: number;
};

export type CobrancaPixEfi = {
  txid: string;
  qrCode: string;
  copiaECola: string;
  expiresAt: Date;
  providerResponse: {
    cobranca: unknown;
    qrcode: unknown;
  };
};
