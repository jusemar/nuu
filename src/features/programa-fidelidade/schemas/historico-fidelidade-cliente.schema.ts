import { z } from "zod";

export const historicoFidelidadeClienteSchema = z.object({
  pagina: z.coerce.number().int().min(1).catch(1),
  porPagina: z.coerce
    .number()
    .pipe(z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(50)]))
    .catch(20),
});

export type FiltrosHistoricoFidelidadeCliente = z.infer<
  typeof historicoFidelidadeClienteSchema
>;
