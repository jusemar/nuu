import { z } from "zod";

const chaveIdempotencia = z
  .string()
  .trim()
  .min(16)
  .max(160)
  .regex(/^[a-zA-Z0-9:_-]+$/);
const justificativa = z.string().trim().min(20).max(2_000).optional();

export const publicarConhecimentoSchema = z
  .object({
    versaoId: z.string().uuid(),
    chaveIdempotencia,
    justificativaAlertas: justificativa,
    conjuntoTesteId: z.string().uuid().optional(),
  })
  .strict();

export const publicarComportamentoSchema = z
  .object({
    versaoId: z.string().uuid(),
    chaveIdempotencia,
    justificativaAlertas: justificativa,
    conjuntoTesteId: z.string().uuid().optional(),
  })
  .strict();

export const publicarLoteConhecimentosSchema = z
  .object({
    execucaoLaboratorioId: z.string().uuid(),
    chaveIdempotencia,
    justificativaAlertas: justificativa,
  })
  .strict();

export type EntradaPublicarConhecimento = z.infer<
  typeof publicarConhecimentoSchema
>;
export type EntradaPublicarComportamento = z.infer<
  typeof publicarComportamentoSchema
>;
export type EntradaPublicarLote = z.infer<
  typeof publicarLoteConhecimentosSchema
>;
