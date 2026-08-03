import { z } from "zod";

import {
  ESTADOS_EDITORIAIS_ADMIN,
  TIPOS_CONHECIMENTO_ADMIN,
} from "../../constants/admin/estados";
import { perguntaRespostaAdminSchema } from "./pergunta-resposta.schema";

const metadadosConhecimentoSchema = z
  .object({
    categoria: z.string().trim().min(2).max(80),
    origem: z.string().trim().min(2).max(200),
    resumoAlteracao: z.string().trim().min(3).max(500),
    titulo: z.string().trim().min(3).max(180),
  })
  .strict();

export const conhecimentoInstitucionalAdminSchema = metadadosConhecimentoSchema
  .extend({
    conteudo: z.string().trim().min(20).max(50_000),
    estado: z.enum(ESTADOS_EDITORIAIS_ADMIN).default("rascunho"),
    tipo: z.literal("institucional"),
  })
  .strict();

export const conhecimentoPerguntaRespostaAdminSchema =
  metadadosConhecimentoSchema
    .extend({
      conteudo: perguntaRespostaAdminSchema,
      estado: z.enum(ESTADOS_EDITORIAIS_ADMIN).default("rascunho"),
      tipo: z.literal("pergunta_resposta"),
    })
    .strict();

export const referenciaComportamentoTomAdminSchema = metadadosConhecimentoSchema
  .extend({
    comportamentoVersaoId: z.string().uuid(),
    estado: z.enum(ESTADOS_EDITORIAIS_ADMIN).default("rascunho"),
    tipo: z.literal("comportamento_tom"),
  })
  .strict();

export const conhecimentoAdminSchema = z.discriminatedUnion("tipo", [
  conhecimentoInstitucionalAdminSchema,
  conhecimentoPerguntaRespostaAdminSchema,
  referenciaComportamentoTomAdminSchema,
]);

export const tipoConhecimentoAdminSchema = z.enum(TIPOS_CONHECIMENTO_ADMIN);
