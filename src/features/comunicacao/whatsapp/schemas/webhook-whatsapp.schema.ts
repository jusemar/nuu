import { z } from "zod";

/**
 * Credenciais exclusivas do webhook.
 *
 * Ficam separadas da configuração de envio (`configuracao-whatsapp.schema.ts`)
 * porque receber eventos e enviar mensagens são capacidades independentes: o
 * webhook pode estar ativo antes de existir qualquer template aprovado, e o
 * envio pode funcionar sem que o webhook esteja publicado.
 */
export const configuracaoWebhookWhatsappSchema = z.object({
  tokenVerificacao: z.string().min(1),
  segredoAplicacao: z.string().min(1),
});

/**
 * Handshake que a Meta dispara ao salvar a URL do webhook no painel.
 *
 * Os nomes com ponto (`hub.mode`) são impostos pela plataforma — é a exceção
 * de nomenclatura prevista nas regras do projeto para APIs externas.
 */
export const verificacaoWebhookWhatsappSchema = z.object({
  "hub.mode": z.literal("subscribe"),
  "hub.verify_token": z.string().min(1),
  "hub.challenge": z.string().min(1),
});

/**
 * Envelope mínimo garantido pela Meta em qualquer evento.
 *
 * Só validamos a casca (`object` + `entry`): o conteúdo de cada mudança varia
 * por campo assinado e é lido separadamente, de forma tolerante, para que um
 * campo novo da Meta nunca derrube a rota.
 */
export const eventoWebhookWhatsappSchema = z.object({
  object: z.string().min(1),
  entry: z
    .array(
      z.object({
        id: z.string().min(1),
        changes: z
          .array(
            z.object({
              field: z.string().min(1),
              value: z.unknown().optional(),
            }),
          )
          .optional(),
      }),
    )
    .min(1),
});

/**
 * Conteúdo de uma mudança do campo `messages`.
 *
 * Todos os campos são opcionais de propósito: este schema serve para extrair
 * um resumo seguro do que chegou, não para rejeitar payloads. O corpo textual
 * da mensagem é deliberadamente ignorado — ele nunca entra em log.
 */
export const conteudoMudancaWebhookWhatsappSchema = z.object({
  messaging_product: z.string().optional(),
  metadata: z
    .object({
      phone_number_id: z.string().optional(),
      display_phone_number: z.string().optional(),
    })
    .optional(),
  messages: z
    .array(
      z.object({
        id: z.string().optional(),
        from: z.string().optional(),
        type: z.string().optional(),
        timestamp: z.string().optional(),
      }),
    )
    .optional(),
  statuses: z
    .array(
      z.object({
        id: z.string().optional(),
        status: z.string().optional(),
        recipient_id: z.string().optional(),
        timestamp: z.string().optional(),
      }),
    )
    .optional(),
});
