import { z } from "zod";

import { ESTADOS_EDITORIAIS_ADMIN } from "../../constants/admin/estados";

const blocoEditavelSchema = z
  .object({
    conteudo: z.string().trim().min(1).max(4_000),
    identificador: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9_]+$/),
    titulo: z.string().trim().min(3).max(120),
  })
  .strict();

export const comportamentoTomAdminSchema = z
  .object({
    blocosEditaveis: z.array(blocoEditavelSchema).max(20),
    estado: z.enum(ESTADOS_EDITORIAIS_ADMIN).default("rascunho"),
    exemplosEvitar: z.array(z.string().trim().min(3).max(500)).max(20),
    exemplosPositivos: z.array(z.string().trim().min(3).max(500)).max(20),
    parametros: z
      .object({
        concisao: z.enum(["curta", "equilibrada", "detalhada"]),
        formalidade: z.enum(["informal_respeitosa", "neutra", "formal"]),
        tratamentoIncerteza: z.enum([
          "declarar_limite",
          "consultar_fonte",
          "transferir_quando_necessario",
        ]),
      })
      .strict(),
    resumoAlteracao: z.string().trim().min(3).max(500),
    versaoNucleoProtegido: z.string().trim().min(3).max(80),
  })
  .strict()
  .superRefine((dados, contexto) => {
    const identificadores = dados.blocosEditaveis.map(
      (bloco) => bloco.identificador,
    );
    if (new Set(identificadores).size !== identificadores.length) {
      contexto.addIssue({
        code: "custom",
        message: "Os blocos editáveis precisam de identificadores únicos.",
        path: ["blocosEditaveis"],
      });
    }
  });
