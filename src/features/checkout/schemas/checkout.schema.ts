import { z } from "zod";

import {
  isValidCPFOrCNPJ,
  isValidNome,
  isValidTelefone,
} from "../lib/validators";

export const itemCheckoutSchema = z.object({
  id: z.string().min(1),
  produtoId: z.string().uuid(),
  nome: z.string().min(1),
  variante: z.string().optional(),
  prazoModalidade: z.string().optional(),
  freteEscolhido: z
    .object({
      id: z.enum(["retirada", "entrega-propria", "padrao"]),
      nome: z.string().min(1),
      prazo: z.string().min(1),
      valorEmCentavos: z.number().int().nonnegative(),
      cep: z.string().optional(),
    })
    .optional(),
  imagemUrl: z.string().min(1),
  precoEmCentavos: z.number().int().nonnegative(),
  quantidade: z.number().int().min(1).max(99),
});

export const checkoutVisitanteSchema = z.object({
  nome: z
    .string()
    .min(3, "Informe seu nome completo")
    .superRefine((nome, ctx) => {
      if (!isValidNome(nome)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe nome e sobrenome usando apenas letras",
        });
      }
    }),
  email: z.email("Informe um e-mail válido"),
  telefone: z
    .string()
    .min(11, "Informe um telefone válido")
    .superRefine((telefone, ctx) => {
      if (!isValidTelefone(telefone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe um celular válido com DDD",
        });
      }
    }),
  documento: z
    .string()
    .min(11, "Informe CPF ou CNPJ")
    .superRefine((documento, ctx) => {
      if (!isValidCPFOrCNPJ(documento)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPF ou CNPJ inválido",
        });
      }
    }),
  cep: z.string().min(8, "Informe um CEP válido"),
  rua: z.string().min(3, "Informe a rua"),
  numero: z.string().min(1, "Informe o número"),
  complemento: z.string().optional(),
  bairro: z.string().min(2, "Informe o bairro"),
  cidade: z.string().min(2, "Informe a cidade"),
  estado: z.string().min(2, "Informe o estado").max(2, "Use a UF"),
  observacao: z.string().optional(),
  permitirEntregaVizinho: z.boolean().optional(),
  nomeVizinho: z.string().optional(),
  enderecoVizinho: z.string().optional(),
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
