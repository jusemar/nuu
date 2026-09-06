export type CriarCobrancaPixEfiInput = {
  numeroPedido: string;
  nome: string;
  documento: string;
  valorEmCentavos: number;
  geracao?: number;
};

export type CobrancaPixEfi = {
  txid: string;
  qrCode: string;
  copiaECola: string;
  expiresAt: Date;
  providerResponse: unknown;
};
