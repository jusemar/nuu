import { z } from "zod";

/** Herdar / Ativado / Desativado da Entrega Própria — validado no servidor. */
export const modoDisponibilidadeEntregaPropriaSchema = z.enum(
  ["herdar", "ativado", "desativado"],
  { message: "Escolha Herdar, Ativado ou Desativado." },
);
