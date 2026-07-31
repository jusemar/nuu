import { z } from "zod";

export const criteriosEscalonamentoModelo = [
  "requisitos_numerosos_ou_conflitantes",
  "dificuldade_compreensao_modelo_principal",
  "recomendacao_maior_risco",
  "falha_validacao_resposta",
  "necessidade_analise_mais_cuidadosa",
] as const;

export const respostaEstruturadaOpenAiSchema = z
  .object({
    criterio_escalonamento: z.enum(criteriosEscalonamentoModelo).nullable(),
    encaminhamento: z.enum([
      "gerar_resposta",
      "solicitar_ferramenta_futura",
      "aguardar_atendimento_humano",
    ]),
    resposta: z.string().trim().min(1).max(4000).nullable(),
  })
  .strict()
  .superRefine((valor, contexto) => {
    if (valor.encaminhamento === "gerar_resposta" && !valor.resposta) {
      contexto.addIssue({
        code: "custom",
        message: "A resposta é obrigatória para gerar resposta.",
        path: ["resposta"],
      });
    }
    if (valor.encaminhamento !== "gerar_resposta" && valor.resposta !== null) {
      contexto.addIssue({
        code: "custom",
        message: "Este encaminhamento não aceita conteúdo de resposta.",
        path: ["resposta"],
      });
    }
  });

export const schemaJsonRespostaOpenAi = {
  additionalProperties: false,
  properties: {
    criterio_escalonamento: {
      anyOf: [
        { enum: [...criteriosEscalonamentoModelo], type: "string" },
        { type: "null" },
      ],
    },
    encaminhamento: {
      enum: [
        "gerar_resposta",
        "solicitar_ferramenta_futura",
        "aguardar_atendimento_humano",
      ],
      type: "string",
    },
    resposta: {
      anyOf: [
        { maxLength: 4000, minLength: 1, type: "string" },
        { type: "null" },
      ],
    },
  },
  required: ["criterio_escalonamento", "encaminhamento", "resposta"],
  type: "object",
} as const;
