import { z } from "zod";

import {
  CLASSIFICACOES_PROBLEMA_ADMIN,
  CRITERIOS_AVALIACAO_ADMIN,
  DECISOES_AVALIACAO_ADMIN,
  VERSAO_RUBRICA_AVALIACAO_ADMIN,
} from "../../constants/admin/rubricas";

export const criterioAvaliacaoAdminSchema = z
  .object({
    criterio: z.enum(CRITERIOS_AVALIACAO_ADMIN),
    nota: z.number().int().min(1).max(5),
  })
  .strict();

export const avaliacaoRespostaAdminSchema = z
  .object({
    classificacaoProblema: z.enum(CLASSIFICACOES_PROBLEMA_ADMIN),
    comentario: z.string().trim().max(2_000).optional(),
    criterios: z
      .array(criterioAvaliacaoAdminSchema)
      .max(CRITERIOS_AVALIACAO_ADMIN.length)
      .default([]),
    decisao: z.enum(DECISOES_AVALIACAO_ADMIN),
    mensagemId: z.string().uuid(),
    nota: z.number().int().min(1).max(5),
    versaoRubrica: z.literal(VERSAO_RUBRICA_AVALIACAO_ADMIN),
  })
  .strict()
  .superRefine((dados, contexto) => {
    const criterios = dados.criterios.map((item) => item.criterio);
    if (new Set(criterios).size !== criterios.length) {
      contexto.addIssue({
        code: "custom",
        message: "Um critério não pode ser avaliado mais de uma vez.",
        path: ["criterios"],
      });
    }
  });
