import { z } from "zod";

import {
  CATEGORIAS_PROPOSTA_MELHORIA_ADMIN,
  ESTADOS_PROPOSTA_MELHORIA_ADMIN,
} from "../../constants/admin/estados";

export const propostaMelhoriaAdminSchema = z
  .object({
    categoria: z.enum(CATEGORIAS_PROPOSTA_MELHORIA_ADMIN),
    criterioAceite: z.string().trim().min(10).max(1_000),
    descricao: z.string().trim().min(20).max(4_000),
    estado: z.enum(ESTADOS_PROPOSTA_MELHORIA_ADMIN).default("aberta"),
    impacto: z.enum(["baixo", "medio", "alto"]),
    prioridade: z.enum(["baixa", "media", "alta", "urgente"]),
    risco: z.enum(["baixo", "medio", "alto", "critico"]),
    titulo: z.string().trim().min(5).max(180),
  })
  .strict();
