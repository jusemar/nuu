import type { z } from "zod";

import {
  CRITERIOS_AVALIACAO_ADMIN,
  VERSAO_RUBRICA_AVALIACAO_ADMIN,
} from "../../../constants/admin/rubricas";
import type { criterioAvaliacaoAdminSchema } from "../../../schemas/admin/avaliacao.schema";

export function validarRubricaAvaliacao(
  criterios: z.infer<typeof criterioAvaliacaoAdminSchema>[],
) {
  const recebidos = new Set(criterios.map((item) => item.criterio));
  return {
    completa: CRITERIOS_AVALIACAO_ADMIN.every((item) => recebidos.has(item)),
    criterios,
    versao: VERSAO_RUBRICA_AVALIACAO_ADMIN,
  };
}
