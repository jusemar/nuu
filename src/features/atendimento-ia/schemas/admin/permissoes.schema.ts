import { z } from "zod";

import {
  CAPACIDADES_ATENDIMENTO_IA_ADMIN,
  PAPEIS_ATENDIMENTO_IA_ADMIN,
} from "../../constants/admin/capacidades";

export const atribuirPapelAtendimentoIaSchema = z
  .object({
    papel: z.enum(PAPEIS_ATENDIMENTO_IA_ADMIN),
    usuarioId: z.string().trim().min(1).max(255),
  })
  .strict();

export const revogarPapelAtendimentoIaSchema = z
  .object({ usuarioId: z.string().trim().min(1).max(255) })
  .strict();

export const atualizarCapacidadesAtendimentoIaSchema = z
  .object({
    capacidadesAdicionais: z
      .array(z.enum(CAPACIDADES_ATENDIMENTO_IA_ADMIN))
      .max(CAPACIDADES_ATENDIMENTO_IA_ADMIN.length),
    usuarioId: z.string().trim().min(1).max(255),
  })
  .strict()
  .superRefine((dados, contexto) => {
    if (
      new Set(dados.capacidadesAdicionais).size !==
      dados.capacidadesAdicionais.length
    ) {
      contexto.addIssue({
        code: "custom",
        message: "Capacidades adicionais não podem se repetir.",
        path: ["capacidadesAdicionais"],
      });
    }
    const permitidas = ["conversas_sanitizadas_leitura"];
    if (
      dados.capacidadesAdicionais.some((item) => !permitidas.includes(item))
    ) {
      contexto.addIssue({
        code: "custom",
        message:
          "Somente capacidades adicionais controladas podem ser atribuídas.",
        path: ["capacidadesAdicionais"],
      });
    }
  });
