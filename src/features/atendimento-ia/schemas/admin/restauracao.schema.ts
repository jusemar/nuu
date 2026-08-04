import { z } from "zod";

const baseRestauracaoSchema = z
  .object({
    chaveIdempotencia: z.string().trim().min(16).max(200),
    justificativa: z.string().trim().min(10).max(1_000),
    recursoId: z.string().uuid(),
    versaoAtualEsperada: z.number().int().positive(),
    versaoOrigemId: z.string().uuid(),
  })
  .strict();

export const restaurarVersaoConhecimentoSchema = baseRestauracaoSchema;
export const restaurarVersaoComportamentoSchema = baseRestauracaoSchema;

export const buscarVersaoHistoricaSchema = z
  .object({
    recursoId: z.string().uuid(),
    tipo: z.enum(["conhecimento", "comportamento"]),
    versaoId: z.string().uuid(),
  })
  .strict();

export const listarRestauracoesSchema = z
  .object({
    limite: z.coerce.number().int().min(1).max(100).default(20),
    pagina: z.coerce.number().int().min(1).max(10_000).default(1),
    recursoId: z.string().uuid(),
    tipo: z.enum(["conhecimento", "comportamento"]),
  })
  .strict();
