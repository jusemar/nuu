import { z } from "zod";

export const LIMITES_FORMULARIO_CONTATO = {
  nome: 100,
  email: 254,
  assunto: 160,
  mensagem: 2_000,
} as const;

export const formularioContatoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(LIMITES_FORMULARIO_CONTATO.nome, "O nome informado é muito longo."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(LIMITES_FORMULARIO_CONTATO.email)
    .email("Informe um e-mail válido."),
  assunto: z
    .string()
    .trim()
    .min(3, "Informe o assunto.")
    .max(
      LIMITES_FORMULARIO_CONTATO.assunto,
      "O assunto informado é muito longo.",
    ),
  mensagem: z
    .string()
    .trim()
    .min(10, "Escreva uma mensagem com pelo menos 10 caracteres.")
    .max(
      LIMITES_FORMULARIO_CONTATO.mensagem,
      `A mensagem deve ter no máximo ${LIMITES_FORMULARIO_CONTATO.mensagem} caracteres.`,
    ),
});

export type DadosFormularioContato = z.infer<typeof formularioContatoSchema>;
