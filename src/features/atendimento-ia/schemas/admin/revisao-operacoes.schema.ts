import { z } from "zod";

import {
  ESTADOS_PROPOSTA_MELHORIA_ADMIN,
  ESTADOS_REVISAO_ADMIN,
} from "../../constants/admin/estados";
import { propostaMelhoriaAdminSchema } from "./proposta-melhoria.schema";

export const criarPropostaMelhoriaPersistidaSchema = propostaMelhoriaAdminSchema
  .omit({ estado: true })
  .extend({ avaliacaoOrigemId: z.string().uuid().optional() })
  .strict();

export const atualizarPropostaMelhoriaSchema = z
  .object({
    atualizadoEmEsperado: z.coerce.date(),
    criterioAceite: z.string().trim().min(10).max(1_000).optional(),
    descricao: z.string().trim().min(20).max(4_000).optional(),
    justificativa: z.string().trim().min(5).max(1_000),
    propostaId: z.string().uuid(),
    responsavelId: z.string().min(1).max(255).nullable().optional(),
    status: z.enum(ESTADOS_PROPOSTA_MELHORIA_ADMIN).optional(),
    titulo: z.string().trim().min(5).max(180).optional(),
  })
  .strict();

export const vincularEvidenciaPropostaSchema = z
  .object({
    data: z.coerce.date(),
    descricao: z.string().trim().min(5).max(1_000),
    propostaId: z.string().uuid(),
    referenciaId: z.string().uuid(),
    tipo: z.enum([
      "conversa",
      "mensagem",
      "execucao",
      "avaliacao",
      "ocorrencia",
      "transferencia",
      "resultado_rag",
    ]),
  })
  .strict();

export const decidirRevisaoSchema = z
  .object({
    atualizadoEmEsperado: z.coerce.date(),
    justificativa: z.string().trim().min(5).max(2_000),
    revisaoId: z.string().uuid(),
    status: z.enum(["aprovada", "reprovada"]),
  })
  .strict();

export const atualizarRevisaoSchema = z
  .object({
    atualizadoEmEsperado: z.coerce.date(),
    revisaoId: z.string().uuid(),
    status: z.enum(ESTADOS_REVISAO_ADMIN),
  })
  .strict();

export const converterPropostaCasoTesteSchema = z
  .object({
    propostaId: z.string().uuid(),
    resumoCenario: z.string().trim().min(20).max(2_000),
  })
  .strict();
