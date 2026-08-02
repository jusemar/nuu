import { z } from "zod";

import { LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO } from "../constants/atendimento-storage";
import { ESTADOS_TRANSFERENCIA_WHATSAPP } from "../constants/transferencia-humana";
import { resumoTransferenciaSchema } from "./transferencia-humana.schema";

export const respostaChatAtendimentoSchema = z
  .object({
    dados: z
      .object({
        conversaId: z.uuid(),
        mensagemClienteId: z.uuid(),
        mensagem: z
          .object({
            autor: z.literal("assistente_ia"),
            conteudo: z.string().trim().min(1).max(4000),
            id: z.uuid(),
          })
          .strict(),
        transferencia: z
          .object({
            explicacao: z.string().trim().min(1).max(500),
            id: z.uuid(),
            link: z.string().url().nullable(),
            resumo: resumoTransferenciaSchema.nullable(),
            status: z.enum(ESTADOS_TRANSFERENCIA_WHATSAPP),
          })
          .strict()
          .nullable(),
      })
      .strict(),
    sucesso: z.literal(true),
  })
  .strict();

export const erroChatAtendimentoSchema = z
  .object({
    erro: z
      .object({
        codigo: z.string().max(80),
        mensagem: z.string().max(LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO),
      })
      .strict(),
    sucesso: z.literal(false),
  })
  .strict();

export const historicoChatAtendimentoSchema = z
  .object({
    dados: z
      .object({
        conversaId: z.uuid(),
        mensagens: z.array(
          z
            .object({
              autor: z.enum(["cliente", "assistente_ia"]),
              conteudo: z.string().min(1).max(4000),
              id: z.uuid(),
            })
            .strict(),
        ),
      })
      .strict(),
    sucesso: z.literal(true),
  })
  .strict();
