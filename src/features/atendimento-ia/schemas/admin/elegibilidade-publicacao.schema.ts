import { z } from "zod";

import { TIPOS_CANDIDATO_PUBLICACAO } from "../../types/admin/publicacao";
export const buscarElegibilidadePublicacaoSchema = z
  .object({
    tipo: z.enum(TIPOS_CANDIDATO_PUBLICACAO),
    candidatoId: z.string().uuid(),
    conjuntoTesteId: z.string().uuid().optional(),
  })
  .strict();
