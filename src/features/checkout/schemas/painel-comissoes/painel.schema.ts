import { z } from "zod";
export const situacaoComissaoSchema = z.enum([
  "aguardando_confirmacao",
  "a_receber",
  "quitada",
  "cancelada",
  "estornada",
]);
export const filtrosComissoesSchema = z
  .object({
    de: z.iso.date().optional(),
    ate: z.iso.date().optional(),
    situacao: situacaoComissaoSchema.optional(),
    busca: z.string().trim().max(150).default(""),
    representanteId: z.string().min(1).max(200).optional(),
    fornecedorId: z.uuid().optional(),
    pagina: z.number().int().min(1).max(100000).default(1),
  })
  .strict()
  .refine((d) => !d.de || !d.ate || d.de <= d.ate, "Período inválido.");
export const quitarComissaoSchema = z
  .object({
    comissaoId: z.uuid(),
    data: z.iso.date(),
    referencia: z.string().trim().max(150).default(""),
    observacao: z.string().trim().max(500).default(""),
  })
  .strict();
