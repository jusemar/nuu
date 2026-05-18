export type EmailPedidoItem = {
  nome: string;
  quantidade: number;
  precoUnitarioEmCentavos: number;
  totalEmCentavos: number;
};

export type EmailPedidoResumo = {
  numeroPedido: string;
  nomeCliente: string;
  emailCliente: string;
  subtotalEmCentavos: number;
  freteEmCentavos: number;
  descontoEmCentavos: number;
  totalEmCentavos: number;
  itens: EmailPedidoItem[];
};

export type EmailPixPendente = EmailPedidoResumo & {
  pix: {
    qrCode: string;
    copiaECola: string;
    expiresAt: Date;
  };
};

export type EmailAttachment = {
  filename: string;
  content: string;
  contentType: string;
  contentId?: string;
};

export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
};
