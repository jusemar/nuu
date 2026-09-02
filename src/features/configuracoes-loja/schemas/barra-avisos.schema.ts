import { z } from "zod";

const corHexadecimalSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Informe uma cor hexadecimal válida.");

export const mensagemBarraAvisosSchema = z.object({
  id: z.string().uuid(),
  texto: z.string().trim().min(1, "Informe o texto.").max(180),
  icone: z.string().trim().max(16, "Use um ícone curto.").optional(),
  ativo: z.boolean(),
});

export const barraAvisosSchema = z.object({
  ativo: z.boolean(),
  corFundo: corHexadecimalSchema,
  corTexto: corHexadecimalSchema,
  velocidadeSegundos: z.number().int().min(10).max(120),
  pausarHover: z.boolean(),
  mensagens: z.array(mensagemBarraAvisosSchema).max(30),
});

export type DadosBarraAvisos = z.infer<typeof barraAvisosSchema>;
