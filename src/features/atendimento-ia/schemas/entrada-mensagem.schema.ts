import { z } from "zod";

import { mensagemAtendenteSchema } from "./mensagem-atendente.schema";

export const entradaMensagemAtendimentoSchema = z
  .object({
    canal: z.literal("site"),
    chaveIdempotencia: z.uuid(),
    conversaId: z.uuid().optional(),
    mensagem: mensagemAtendenteSchema,
  })
  .strict();
