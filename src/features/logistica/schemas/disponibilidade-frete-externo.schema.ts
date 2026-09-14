import { z } from "zod";

import { MODOS_DISPONIBILIDADE_FRETE_EXTERNO } from "../constants/frete-externo";

/** Herdar / Ativado / Desativado — validado no cliente e no servidor. */
export const modoDisponibilidadeFreteExternoSchema = z.enum(
  MODOS_DISPONIBILIDADE_FRETE_EXTERNO,
  { message: "Escolha Herdar, Ativado ou Desativado." },
);

export const salvarFreteExternoCategoriaSchema = z.object({
  categoriaId: z.string().uuid("Categoria inválida."),
  modo: modoDisponibilidadeFreteExternoSchema,
});
