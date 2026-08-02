import { z } from "zod";

import { MOTIVOS_TRANSFERENCIA_HUMANA } from "../constants/transferencia-humana";

export const criteriosEscalonamentoModelo = [
  "requisitos_numerosos_ou_conflitantes",
  "dificuldade_compreensao_modelo_principal",
  "recomendacao_maior_risco",
  "falha_validacao_resposta",
  "necessidade_analise_mais_cuidadosa",
] as const;

const decisaoRespostaSchema = z.discriminatedUnion("encaminhamento", [
  z.object({
    encaminhamento: z.literal("gerar_resposta"),
    resposta: z.string().trim().min(1).max(4000),
    transferencia: z.null(),
  }).strict(),
  z.object({
    encaminhamento: z.literal("solicitar_ferramenta_futura"),
    resposta: z.string().trim().min(1).max(4000),
    transferencia: z.object({
      explicacao: z.string().trim().min(1).max(500),
      motivo: z.literal("ferramenta_autorizada_ausente"),
    }).strict(),
  }).strict(),
  z.object({
    encaminhamento: z.literal("aguardar_atendimento_humano"),
    resposta: z.null(),
    transferencia: z.object({
      explicacao: z.string().trim().min(1).max(500),
      motivo: z.enum(MOTIVOS_TRANSFERENCIA_HUMANA),
    }).strict(),
  }).strict(),
]);

export const respostaEstruturadaOpenAiSchema = z.object({
  criterio_escalonamento: z.enum(criteriosEscalonamentoModelo).nullable(),
  decisao: decisaoRespostaSchema,
}).strict();

export const schemaJsonRespostaOpenAi = {
  additionalProperties: false,
  properties: {
    criterio_escalonamento: {
      anyOf: [
        { enum: [...criteriosEscalonamentoModelo], type: "string" },
        { type: "null" },
      ],
    },
    decisao: {
      anyOf: [
        {
          additionalProperties: false,
          properties: {
            encaminhamento: { enum: ["gerar_resposta"], type: "string" },
            resposta: { maxLength: 4000, minLength: 1, type: "string" },
            transferencia: { type: "null" },
          },
          required: ["encaminhamento", "resposta", "transferencia"],
          type: "object",
        },
        {
          additionalProperties: false,
          properties: {
            encaminhamento: { enum: ["solicitar_ferramenta_futura"], type: "string" },
            resposta: { maxLength: 4000, minLength: 1, type: "string" },
            transferencia: {
              additionalProperties: false,
              properties: {
                explicacao: { maxLength: 500, minLength: 1, type: "string" },
                motivo: { enum: ["ferramenta_autorizada_ausente"], type: "string" },
              },
              required: ["explicacao", "motivo"],
              type: "object",
            },
          },
          required: ["encaminhamento", "resposta", "transferencia"],
          type: "object",
        },
        {
          additionalProperties: false,
          properties: {
            encaminhamento: { enum: ["aguardar_atendimento_humano"], type: "string" },
            resposta: { type: "null" },
            transferencia: {
              additionalProperties: false,
              properties: {
                explicacao: { maxLength: 500, minLength: 1, type: "string" },
                motivo: { enum: [...MOTIVOS_TRANSFERENCIA_HUMANA], type: "string" },
              },
              required: ["explicacao", "motivo"],
              type: "object",
            },
          },
          required: ["encaminhamento", "resposta", "transferencia"],
          type: "object",
        },
      ],
    },
  },
  required: ["criterio_escalonamento", "decisao"],
  type: "object",
} as const;
