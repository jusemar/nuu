import { z } from "zod";

import { slugPaginaEhReservado } from "../lib/slugs-reservados";
import { conteudoPaginaDinamicaSchema } from "./conteudo-pagina-dinamica.schema";

const identificadorSchema = z
  .string()
  .trim()
  .min(1, "Informe o identificador.")
  .max(120, "O identificador deve ter no máximo 120 caracteres.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use somente letras minúsculas, números e hífens, sem hífens nas extremidades.",
  );

const slugPaginaSchema = identificadorSchema.refine(
  (slug) => !slugPaginaEhReservado(slug),
  "Este slug é reservado por uma rota existente da loja.",
);

const textoOpcional = (limite: number) =>
  z
    .string()
    .trim()
    .max(limite)
    .nullable()
    .optional()
    .transform((valor) => valor || null);

export const idPaginaDinamicaSchema = z.string().uuid("Página inválida.");
export const idGrupoNavegacaoSchema = z.string().uuid("Grupo inválido.");

export const salvarPaginaDinamicaSchema = z.object({
  id: idPaginaDinamicaSchema.optional(),
  titulo: z.string().trim().min(1, "Informe o título.").max(180),
  slug: slugPaginaSchema,
  // Somente a árvore JSON explicitamente aceita pelo editor mínimo é persistida.
  conteudo: conteudoPaginaDinamicaSchema,
  status: z.enum(["rascunho", "publicada", "arquivada"]),
  tituloSeo: textoOpcional(180),
  descricaoSeo: textoOpcional(320),
  publicadaEm: z.coerce.date().nullable().optional(),
});

export const listarPaginasDinamicasSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().trim().max(180).optional(),
  status: z.enum(["rascunho", "publicada", "arquivada"]).optional(),
});

export const salvarGrupoNavegacaoSchema = z.object({
  id: idGrupoNavegacaoSchema.optional(),
  nome: z.string().trim().min(1, "Informe o nome administrativo.").max(120),
  tituloPublico: z.string().trim().min(1, "Informe o título público.").max(120),
  identificador: identificadorSchema,
  localExibicao: z.literal("rodape").default("rodape"),
  ativo: z.boolean().default(false),
  ordem: z.coerce.number().int().min(0).default(0),
});

export const associarPaginaGrupoSchema = z.object({
  grupoId: idGrupoNavegacaoSchema,
  paginaId: idPaginaDinamicaSchema,
  textoLink: textoOpcional(180),
  ordem: z.coerce.number().int().min(0),
  ativo: z.boolean().default(true),
});

export const editarVinculoPaginaGrupoSchema = z.object({
  grupoId: idGrupoNavegacaoSchema,
  paginaId: idPaginaDinamicaSchema,
  textoLink: textoOpcional(180),
  ativo: z.boolean(),
});

export const removerPaginaGrupoSchema = z.object({
  grupoId: idGrupoNavegacaoSchema,
  paginaId: idPaginaDinamicaSchema,
});

export const reordenarGruposSchema = z.object({
  localExibicao: z.literal("rodape"),
  idsOrdenados: z
    .array(idGrupoNavegacaoSchema)
    .min(1)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Não repita grupos na ordenação.",
    ),
});

export const reordenarPaginasGrupoSchema = z.object({
  grupoId: idGrupoNavegacaoSchema,
  idsPaginasOrdenadas: z
    .array(idPaginaDinamicaSchema)
    .min(1)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Não repita páginas na ordenação.",
    ),
});

export const alterarAtivacaoGrupoSchema = z.object({
  id: idGrupoNavegacaoSchema,
  ativo: z.boolean(),
});
export const arquivarPaginaSchema = z.object({ id: idPaginaDinamicaSchema });
