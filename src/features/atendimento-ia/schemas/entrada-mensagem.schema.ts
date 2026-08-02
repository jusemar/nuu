import { z } from "zod";

import { VERSAO_AVISO_PRIVACIDADE_CHAT } from "../constants/contexto";
import { mensagemAtendenteSchema } from "./mensagem-atendente.schema";

export const entradaMensagemAtendimentoSchema = z
  .object({
    canal: z.literal("site"),
    chaveIdempotencia: z.uuid(),
    conversaId: z.uuid().optional(),
    mensagem: mensagemAtendenteSchema,
    avisoPrivacidadeVersao: z.literal(VERSAO_AVISO_PRIVACIDADE_CHAT),
  })
  .strict();
