import { z } from "zod";

/** Lista fechada: o cliente não escolhe SKU, status, comissões ou estrutura de variantes. */
export const dadosProdutoRepresentanteSchema = z
  .object({
    nome: z.string().trim().min(2).max(200),
    categoriaId: z.uuid(),
    marcaId: z.uuid(),
    descricao: z.string().max(50000).default(""),
    codigoFornecedor: z.string().trim().max(100).default(""),
    precoCentavos: z.number().int().min(1).max(100000000),
    estoque: z.number().int().min(0).max(2147483647),
    prazo: z.string().trim().max(300).default(""),
    gtin: z.string().trim().max(14).default(""),
    mpn: z.string().trim().max(100).default(""),
    ncm: z.string().trim().max(20).default(""),
    pesoGramas: z
      .number()
      .int()
      .min(0)
      .max(2147483647)
      .nullable()
      .default(null),
    alturaCm: z.number().int().min(0).max(100000).nullable().default(null),
    larguraCm: z.number().int().min(0).max(100000).nullable().default(null),
    comprimentoCm: z.number().int().min(0).max(100000).nullable().default(null),
    garantiaDias: z.number().int().min(0).max(100000).nullable().default(null),
    garantiaResponsavel: z.string().trim().max(200).default(""),
    slug: z
      .string()
      .trim()
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .or(z.literal(""))
      .default(""),
    metaTitulo: z.string().trim().max(200).default(""),
    metaDescricao: z.string().trim().max(500).default(""),
    productKind: z.literal("simple").default("simple"),
    modalidade: z.literal("dropshipping").default("dropshipping"),
  })
  .strict();
export const criarProdutoRepresentanteSchema = z
  .object({ fornecedorId: z.uuid(), dados: dadosProdutoRepresentanteSchema })
  .strict();
export const editarProdutoRepresentanteSchema = z
  .object({
    fornecedorId: z.uuid(),
    produtoId: z.uuid(),
    versao: z.iso.datetime(),
    dados: dadosProdutoRepresentanteSchema,
  })
  .strict();
export const editarCampoRepresentanteSchema = z
  .object({
    fornecedorId: z.uuid(),
    produtoId: z.uuid(),
    versao: z.iso.datetime(),
    alteracao: z.discriminatedUnion("campo", [
      z
        .object({
          campo: z.literal("nome"),
          valor: z.string().trim().min(2).max(200),
        })
        .strict(),
      z
        .object({
          campo: z.literal("precoCentavos"),
          valor: z.number().int().min(1).max(100000000),
        })
        .strict(),
      z
        .object({
          campo: z.literal("estoque"),
          valor: z.number().int().min(0).max(2147483647),
        })
        .strict(),
    ]),
  })
  .strict();
export const recursoRepresentanteSchema = z
  .object({ fornecedorId: z.uuid(), produtoId: z.uuid() })
  .strict();
export type DadosProdutoRepresentante = z.infer<
  typeof dadosProdutoRepresentanteSchema
>;
