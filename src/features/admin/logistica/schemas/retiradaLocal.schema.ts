import { z } from "zod";

export const modeloRetiradaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100),
  prazoTexto: z.string().min(1, "Prazo é obrigatório").max(255),
  mensagem: z.string().max(500).nullable().optional(),
  ativo: z.boolean().default(true),
});

export const criarModeloRetiradaSchema = modeloRetiradaSchema;
export const atualizarModeloRetiradaSchema = modeloRetiradaSchema.partial();

export type ModeloRetiradaInput = z.infer<typeof modeloRetiradaSchema>;