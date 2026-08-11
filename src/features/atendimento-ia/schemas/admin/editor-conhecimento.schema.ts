import { z } from "zod";

import { perguntaRespostaAdminSchema } from "./pergunta-resposta.schema";

const metadados = z.object({
  categoria: z.string().trim().min(2).max(80),
  motivoAlteracao: z.string().trim().min(5).max(500),
  origem: z.string().trim().min(2).max(200),
  tituloAdministrativo: z.string().trim().min(3).max(180),
});
export const conteudoInstitucionalEditorSchema = z
  .object({
    conteudoOficial: z.string().trim().min(20).max(50_000),
    observacoesInternas: z.string().trim().max(2_000).optional(),
    palavrasChave: z
      .array(z.string().trim().min(2).max(80))
      .max(30)
      .default([]),
    prioridade: z.enum(["baixa", "media", "alta", "critica"]),
    quandoNaoUtilizar: z.string().trim().min(5).max(4_000),
    quandoUtilizar: z.string().trim().min(5).max(4_000),
    termosRelacionados: z
      .array(z.string().trim().min(2).max(120))
      .max(30)
      .default([]),
  })
  .strict();
export const criarConhecimentoInstitucionalEditorSchema = metadados
  .extend({
    conteudo: conteudoInstitucionalEditorSchema,
    tipoConhecimento: z.literal("institucional"),
  })
  .strict();

export const criarConhecimentoFaqEditorSchema = metadados
  .extend({
    conteudo: perguntaRespostaAdminSchema,
    tipoConhecimento: z.literal("pergunta_resposta"),
  })
  .strict();

export const criarConhecimentoEditorSchema = z.discriminatedUnion(
  "tipoConhecimento",
  [
    criarConhecimentoInstitucionalEditorSchema,
    criarConhecimentoFaqEditorSchema,
  ],
);
export const criarVersaoConhecimentoSchema = z
  .object({
    conhecimentoId: z.string().uuid(),
    conteudo: z.union([
      conteudoInstitucionalEditorSchema,
      perguntaRespostaAdminSchema,
    ]),
    motivoAlteracao: z.string().trim().min(5).max(500),
    resumoAlteracao: z.string().trim().min(5).max(500),
  })
  .strict();
export const atualizarRascunhoConhecimentoSchema = criarVersaoConhecimentoSchema
  .omit({ conhecimentoId: true })
  .extend({
    atualizadoEmEsperado: z.coerce.date(),
    versaoId: z.string().uuid(),
  })
  .strict();
export const conhecimentoIdSchema = z
  .object({ conhecimentoId: z.string().uuid() })
  .strict();
export const enviarRevisaoConhecimentoSchema = z
  .object({
    atualizadoEmEsperado: z.coerce.date(),
    versaoId: z.string().uuid(),
  })
  .strict();
export const revisarConhecimentoSchema = enviarRevisaoConhecimentoSchema
  .extend({
    decisao: z.enum(["aprovada", "reprovada"]),
    motivo: z.string().trim().min(5).max(1_000),
  })
  .strict();
