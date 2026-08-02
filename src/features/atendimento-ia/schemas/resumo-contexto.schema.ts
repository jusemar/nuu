import { z } from "zod";

const lista = z.array(z.string().max(500)).max(30);

export const resumoContextoSchema = z
  .object({
    objetivo: z.string().max(1_000),
    fatosConfirmados: lista,
    hipotesesEDuvidas: lista,
    decisoes: lista,
    pendencias: lista,
    produtosDiscutidos: lista,
    ferramentasEAcoes: lista,
  })
  .strict();

export const schemaJsonResumoContexto = {
  additionalProperties: false,
  properties: {
    objetivo: { type: "string" },
    fatosConfirmados: { items: { type: "string" }, type: "array" },
    hipotesesEDuvidas: { items: { type: "string" }, type: "array" },
    decisoes: { items: { type: "string" }, type: "array" },
    pendencias: { items: { type: "string" }, type: "array" },
    produtosDiscutidos: { items: { type: "string" }, type: "array" },
    ferramentasEAcoes: { items: { type: "string" }, type: "array" },
  },
  required: [
    "objetivo",
    "fatosConfirmados",
    "hipotesesEDuvidas",
    "decisoes",
    "pendencias",
    "produtosDiscutidos",
    "ferramentasEAcoes",
  ],
  type: "object",
} as const;
