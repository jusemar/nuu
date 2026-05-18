import { z } from "zod";

import {
  isValidCPFOrCNPJ,
  isValidNome,
  isValidTelefone,
} from "@/features/checkout/lib/validators";

const hoje = new Date();

export const completarCadastroClienteSchema = z
  .object({
    tipoPessoa: z.enum(["fisica", "juridica"], {
      message: "Informe o tipo de pessoa.",
    }),
    nomeCompleto: z
      .string()
      .min(3, "Informe o nome completo")
      .superRefine((nome, ctx) => {
        if (!isValidNome(nome)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Informe nome e sobrenome usando apenas letras",
          });
        }
      }),
    documento: z.string().superRefine((documento, ctx) => {
      if (!isValidCPFOrCNPJ(documento)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPF ou CNPJ inválido",
        });
      }
    }),
    telefone: z.string().superRefine((telefone, ctx) => {
      if (!isValidTelefone(telefone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe um celular válido com DDD",
        });
      }
    }),
    dataNascimento: z.string().optional(),
    observacaoCliente: z.string().max(500, "Use até 500 caracteres").optional(),
    cep: z.string().min(8, "Informe um CEP válido"),
    rua: z.string().min(3, "Informe a rua"),
    numero: z.string().min(1, "Informe o número"),
    complemento: z.string().optional(),
    bairro: z.string().min(2, "Informe o bairro"),
    cidade: z.string().min(2, "Informe a cidade"),
    estado: z.string().min(2, "Informe o estado").max(2, "Use a UF"),
    autorizarEntregaVizinho: z.boolean().optional(),
    nomeVizinho: z.string().max(120, "Use até 120 caracteres").optional(),
    observacaoVizinho: z.string().max(300, "Use até 300 caracteres").optional(),
  })
  .superRefine((dados, ctx) => {
    const documentoLimpo = dados.documento.replace(/\D/g, "");

    if (dados.tipoPessoa === "fisica" && documentoLimpo.length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documento"],
        message: "Informe um CPF válido para pessoa física.",
      });
    }

    if (dados.tipoPessoa === "juridica" && documentoLimpo.length !== 14) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documento"],
        message: "Informe um CNPJ válido para pessoa jurídica.",
      });
    }

    if (dados.tipoPessoa === "fisica") {
      if (!dados.dataNascimento) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dataNascimento"],
          message: "Informe a data de nascimento.",
        });
        return;
      }

      const dataNascimento = new Date(`${dados.dataNascimento}T00:00:00`);

      if (Number.isNaN(dataNascimento.getTime()) || dataNascimento >= hoje) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dataNascimento"],
          message: "Informe uma data de nascimento válida.",
        });
      }
    }

    if (dados.autorizarEntregaVizinho && !dados.nomeVizinho?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nomeVizinho"],
        message: "Informe o nome do vizinho autorizado.",
      });
    }
  });

export type CompletarCadastroClienteSchema = z.infer<
  typeof completarCadastroClienteSchema
>;
