import { z } from "zod";

import { LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO } from "../constants/atendimento-storage";

export const mensagemAtendenteSchema = z
  .string()
  .trim()
  .min(1, "Digite uma mensagem para continuar.")
  .max(
    LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO,
    `A mensagem deve ter no máximo ${LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO} caracteres.`,
  );

const contextoProdutoSchema = z.object({
  tipo: z.literal("produto"),
  produto: z.object({
    id: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    nome: z.string().trim().min(1),
  }),
});

const contextoHomeSchema = z.object({
  tipo: z.literal("home"),
});

export const handoffAtendimentoSchema = z.object({
  versao: z.literal(1),
  mensagem: mensagemAtendenteSchema,
  contexto: z.discriminatedUnion("tipo", [
    contextoHomeSchema,
    contextoProdutoSchema,
  ]),
});

export type ContextoAtendimento = z.infer<
  typeof handoffAtendimentoSchema
>["contexto"];

export type HandoffAtendimento = z.infer<typeof handoffAtendimentoSchema>;
