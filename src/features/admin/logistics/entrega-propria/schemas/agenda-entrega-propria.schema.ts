import { z } from "zod";

const horario = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido.");

export const agendaEntregaPropriaSchema = z
  .object({
    ativa: z.boolean(),
    diasDaSemana: z
      .array(z.number().int().min(0).max(6))
      .transform((dias) => [...new Set(dias)].sort((a, b) => a - b)),
    horarioCorte: horario,
  })
  .superRefine((agenda, contexto) => {
    if (agenda.ativa && agenda.diasDaSemana.length === 0) {
      contexto.addIssue({
        code: "custom",
        path: ["diasDaSemana"],
        message: "Selecione ao menos um dia para ativar a agenda.",
      });
    }
  });

export type AgendaEntregaPropriaForm = z.infer<
  typeof agendaEntregaPropriaSchema
>;
