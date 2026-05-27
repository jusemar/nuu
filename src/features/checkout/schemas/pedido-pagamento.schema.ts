import { z } from "zod";

export const pedidoStatusCheckoutSchema = z.enum([
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
  "expired",
]);

export const pagamentoGatewayCheckoutSchema = z.enum(["stripe", "efibank"]);

export const pagamentoMetodoCheckoutSchema = z.enum(["cartao", "pix"]);

export const pagamentoStatusCheckoutSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "expired",
]);

export const criarClienteCheckoutSchema = z.object({
  userId: z.string().optional().nullable(),
  nome: z.string().min(3),
  email: z.email(),
  telefone: z.string().min(10),
  documento: z.string().min(11),
});

export const criarEnderecoCheckoutSchema = z.object({
  clienteId: z.string().uuid(),
  cep: z.string().min(8),
  rua: z.string().min(3),
  numero: z.string().min(1),
  complemento: z.string().optional().nullable(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().min(2).max(2),
  observacao: z.string().optional().nullable(),
});

export const criarPedidoCheckoutSchema = z.object({
  numeroPedido: z.string().regex(/^#\d{4,}$/),
  clienteId: z.string().uuid(),
  enderecoId: z.string().uuid(),
  status: pedidoStatusCheckoutSchema.default("pending"),
  subtotalEmCentavos: z.number().int().nonnegative(),
  freteEmCentavos: z.number().int().nonnegative(),
  descontoEmCentavos: z.number().int().nonnegative().default(0),
  totalEmCentavos: z.number().int().nonnegative(),
  gatewayPagamento: pagamentoGatewayCheckoutSchema,
  pagamentoStatus: pagamentoStatusCheckoutSchema.default("pending"),
  observacao: z.string().optional().nullable(),
});

export const criarPedidoItemCheckoutSchema = z.object({
  pedidoId: z.string().uuid(),
  produtoId: z.string().uuid(),
  varianteId: z.string().uuid().optional().nullable(),
  nomeProduto: z.string().min(1),
  nomeVariante: z.string().optional().nullable(),
  atributosVariante: z.record(z.string(), z.string()).default({}),
  skuProduto: z.string().optional().nullable(),
  modalidade: z.string().optional().nullable(),
  prazoModalidade: z.string().optional().nullable(),
  imagemUrl: z.string().optional().nullable(),
  quantidade: z.number().int().min(1),
  precoUnitarioEmCentavos: z.number().int().nonnegative(),
  totalEmCentavos: z.number().int().nonnegative(),
});

export const criarPagamentoCheckoutSchema = z.object({
  pedidoId: z.string().uuid(),
  gateway: pagamentoGatewayCheckoutSchema,
  metodo: pagamentoMetodoCheckoutSchema,
  status: pagamentoStatusCheckoutSchema.default("pending"),
  valorEmCentavos: z.number().int().positive(),
  transactionId: z.string().optional().nullable(),
  pixTxid: z.string().optional().nullable(),
  qrCode: z.string().optional().nullable(),
  copiaECola: z.string().optional().nullable(),
  providerResponse: z.unknown().optional().nullable(),
  expiresAt: z.date().optional().nullable(),
  paidAt: z.date().optional().nullable(),
});

export type CriarClienteCheckoutSchema = z.infer<
  typeof criarClienteCheckoutSchema
>;
export type CriarEnderecoCheckoutSchema = z.infer<
  typeof criarEnderecoCheckoutSchema
>;
export type CriarPedidoCheckoutSchema = z.infer<
  typeof criarPedidoCheckoutSchema
>;
export type CriarPedidoItemCheckoutSchema = z.infer<
  typeof criarPedidoItemCheckoutSchema
>;
export type CriarPagamentoCheckoutSchema = z.infer<
  typeof criarPagamentoCheckoutSchema
>;
