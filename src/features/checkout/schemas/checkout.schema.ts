import { z } from "zod";

export const itemCheckoutSchema = z.object({
  id: z.string().min(1),
  produtoId: z.string().uuid(),
  nome: z.string().min(1),
  variante: z.string().optional(),
  prazoModalidade: z.string().optional(),
  imagemUrl: z.string().min(1),
  precoEmCentavos: z.number().int().nonnegative(),
  quantidade: z.number().int().min(1).max(99),
});

export const checkoutVisitanteSchema = z.object({
  nome: z.string().min(3, "Informe seu nome completo"),
  email: z.email("Informe um e-mail válido"),
  telefone: z.string().min(10, "Informe um telefone válido"),
  documento: z.string().min(11, "Informe CPF ou CNPJ"),
  cep: z.string().min(8, "Informe um CEP válido"),
  rua: z.string().min(3, "Informe a rua"),
  numero: z.string().min(1, "Informe o número"),
  complemento: z.string().optional(),
  bairro: z.string().min(2, "Informe o bairro"),
  cidade: z.string().min(2, "Informe a cidade"),
  estado: z.string().min(2, "Informe o estado").max(2, "Use a UF"),
  observacao: z.string().optional(),
  cupom: z.string().optional(),
  freteId: z.enum(["retirada", "padrao", "expresso"]),
  formaPagamento: z.enum(["pix", "cartao"]),
  parcelasCartao: z.coerce.number().int().min(1).max(12).optional(),
  itens: z.array(itemCheckoutSchema).min(1, "Seu carrinho está vazio"),
});

export const validarCupomCheckoutSchema = z.object({
  cupom: z.string().min(1),
});

export type CheckoutVisitanteSchema = z.infer<typeof checkoutVisitanteSchema>;
export type ValidarCupomCheckoutSchema = z.infer<
  typeof validarCupomCheckoutSchema
>;
