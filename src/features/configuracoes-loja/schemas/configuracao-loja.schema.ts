import { z } from "zod";

export const configuracaoLojaSchema = z.object({
  nomeComercial: z
    .string()
    .max(120, "O nome comercial deve ter no máximo 120 caracteres."),
});
