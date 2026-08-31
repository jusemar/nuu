import type { z } from "zod";

import type {
  configuracaoWebhookWhatsappSchema,
  eventoWebhookWhatsappSchema,
} from "../schemas/webhook-whatsapp.schema";

export type ConfiguracaoWebhookWhatsapp = z.infer<
  typeof configuracaoWebhookWhatsappSchema
>;

export type EventoWebhookWhatsapp = z.infer<typeof eventoWebhookWhatsappSchema>;

/** Resultado do handshake `GET` — modelado como união para não devolver desafio sem autorização. */
export type ResultadoVerificacaoWebhookWhatsapp =
  | { autorizado: true; desafio: string }
  | { autorizado: false; motivo: "PARAMETROS_INVALIDOS" | "TOKEN_INCORRETO" };

/** Mensagem recebida, já reduzida ao que pode ser registrado com segurança. */
export type ResumoMensagemWebhookWhatsapp = {
  idMensagem: string;
  tipo: string;
  remetenteMascarado: string;
};

/** Atualização de entrega (`sent`, `delivered`, `read`, `failed`). */
export type ResumoStatusWebhookWhatsapp = {
  idMensagem: string;
  status: string;
  destinatarioMascarado: string;
};

export type ResumoEventoWebhookWhatsapp = {
  objeto: string;
  totalEntradas: number;
  campos: string[];
  mensagens: ResumoMensagemWebhookWhatsapp[];
  atualizacoesDeStatus: ResumoStatusWebhookWhatsapp[];
};
