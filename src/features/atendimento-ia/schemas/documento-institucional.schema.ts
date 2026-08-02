import { z } from "zod";

import { CATEGORIAS_INSTITUCIONAIS_AUTORIZADAS } from "../constants/rag";

export const documentoInstitucionalSchema = z.object({
  categoria: z.enum(CATEGORIAS_INSTITUCIONAIS_AUTORIZADAS),
  chaveEstavel: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  conteudo: z.string().trim().min(1).max(500_000),
  metadados: z.record(z.string(), z.unknown()).optional().default({}),
  origem: z.string().trim().min(1).max(500),
  titulo: z.string().trim().min(3).max(300),
});

export const estadoEditorialDocumentoSchema = z.enum([
  "rascunho",
  "em_revisao",
  "publicado",
  "desativado",
]);
