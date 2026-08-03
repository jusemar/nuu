import { z } from "zod";

import {
  CRITICIDADES_ADMIN,
  ESTADOS_CASO_TESTE_ADMIN,
} from "../../constants/admin/estados";

const textoListaSchema = z.string().trim().min(2).max(500);

export const casoTesteAdminSchema = z
  .object({
    bloqueiaPublicacao: z.boolean(),
    contextoFicticio: z.record(z.string(), z.unknown()).default({}),
    criticidade: z.enum(CRITICIDADES_ADMIN),
    efeitosReais: z.literal("proibidos"),
    entrada: z.string().trim().min(1).max(4_000),
    estado: z.enum(ESTADOS_CASO_TESTE_ADMIN).default("rascunho"),
    expectativas: z.array(textoListaSchema).min(1).max(30),
    ferramentasProibidas: z.array(z.string().trim().min(2).max(120)).max(30),
    ferramentasRequeridas: z.array(z.string().trim().min(2).max(120)).max(30),
    nome: z.string().trim().min(3).max(180),
  })
  .strict()
  .superRefine((dados, contexto) => {
    const proibidas = new Set(dados.ferramentasProibidas);
    if (
      dados.ferramentasRequeridas.some((ferramenta) =>
        proibidas.has(ferramenta),
      )
    ) {
      contexto.addIssue({
        code: "custom",
        message:
          "Uma ferramenta não pode ser requerida e proibida no mesmo caso.",
        path: ["ferramentasRequeridas"],
      });
    }
    if (dados.criticidade === "critica" && !dados.bloqueiaPublicacao) {
      contexto.addIssue({
        code: "custom",
        message: "Casos críticos devem bloquear a publicação.",
        path: ["bloqueiaPublicacao"],
      });
    }
  });
