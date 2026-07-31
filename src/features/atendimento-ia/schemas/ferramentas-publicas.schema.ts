import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const skuSchema = z.string().trim().min(1).max(120).nullable();
const modalidadeSchema = z.string().trim().min(1).max(60).nullable();

export const argumentosBuscarProdutosPublicosSchema = z
  .object({
    termo: z.string().trim().min(1).max(120),
  })
  .strict();

export const argumentosConsultarProdutoPublicoSchema = z
  .object({ slug: slugSchema })
  .strict();

export const argumentosConsultarCondicaoProdutoSchema = z
  .object({
    modalidade: modalidadeSchema,
    sku_variante: skuSchema,
    slug: slugSchema,
  })
  .strict();

export const argumentosConsultarLogisticaPublicaSchema = z
  .object({
    cep: z
      .string()
      .trim()
      .regex(/^\d{5}-?\d{3}$/),
    modalidade: modalidadeSchema,
    quantidade: z.number().int().min(1).max(20),
    sku_variante: skuSchema,
    slug: slugSchema,
  })
  .strict();

const baseResultadoSchema = {
  consultado_em: z.string().datetime(),
  fonte: z.string().trim().min(1).max(80),
  status: z.enum([
    "encontrado",
    "nenhum_resultado",
    "dado_indisponivel",
    "argumento_invalido",
    "ferramenta_nao_autorizada",
    "falha_recuperavel",
    "falha_definitiva",
  ]),
};

const precoPublicoSchema = z
  .object({
    boleto_ativo: z.boolean(),
    modalidade: z.string(),
    moeda: z.literal("BRL"),
    parcelamentos_cartao: z
      .array(
        z
          .object({
            parcelas: z.number().int().positive(),
            sem_juros: z.boolean(),
            total_em_centavos: z.number().int().nonnegative(),
            valor_parcela_em_centavos: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .max(24),
    pix_ativo: z.boolean(),
    preco_final_em_centavos: z.number().int().nonnegative(),
    preco_original_em_centavos: z.number().int().nonnegative(),
    valor_pix_em_centavos: z.number().int().nonnegative(),
  })
  .strict();

export const resultadoBuscarProdutosPublicosSchema = z
  .object({
    ...baseResultadoSchema,
    dados: z
      .object({
        produtos: z
          .array(
            z
              .object({
                categoria: z.string().nullable(),
                imagem_url: z.string().nullable(),
                nome: z.string(),
                preco_em_centavos: z.number().int().nonnegative().nullable(),
                slug: z.string(),
              })
              .strict(),
          )
          .max(5),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const resultadoConsultarProdutoPublicoSchema = z
  .object({
    ...baseResultadoSchema,
    dados: z
      .object({
        atributos: z.array(
          z.object({ nome: z.string(), valor: z.string() }).strict(),
        ),
        categoria: z.string().nullable(),
        descricao: z.string(),
        garantia_dias: z.number().int().nonnegative().nullable(),
        marca: z.string().nullable(),
        nome: z.string(),
        slug: z.string(),
        tipo: z.enum(["simples", "variavel"]),
        variantes: z
          .array(
            z
              .object({
                atributos: z.record(z.string(), z.string()),
                nome: z.string().nullable(),
                sku: z.string(),
              })
              .strict(),
          )
          .max(100),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const resultadoConsultarPrecosPublicosSchema = z
  .object({
    ...baseResultadoSchema,
    dados: z
      .object({
        precos: z.array(precoPublicoSchema).max(100),
        produto: z.string(),
        variante: z.string().nullable(),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const resultadoConsultarEstoquePublicoSchema = z
  .object({
    ...baseResultadoSchema,
    dados: z
      .object({
        disponibilidade: z.enum([
          "disponivel",
          "indisponivel",
          "selecione_variante",
        ]),
        modalidade: z.string().nullable(),
        produto: z.string(),
        variante: z.string().nullable(),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const resultadoConsultarPromocoesPublicasSchema = z
  .object({
    ...baseResultadoSchema,
    dados: z
      .object({
        modalidade: z.string().nullable(),
        produto: z.string(),
        promocoes: z
          .array(
            z
              .object({
                badge: z.string().nullable(),
                desconto_em_centavos: z.number().int().nonnegative(),
                preco_final_em_centavos: z.number().int().nonnegative(),
                preco_original_em_centavos: z.number().int().nonnegative(),
                termina_em: z.string().datetime().nullable(),
                tipo: z.enum(["normal", "relampago"]).nullable(),
              })
              .strict(),
          )
          .max(100),
        variante: z.string().nullable(),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const resultadoConsultarLogisticaPublicaSchema = z
  .object({
    ...baseResultadoSchema,
    dados: z
      .object({
        opcoes: z
          .array(
            z
              .object({
                nome: z.string(),
                prazo: z.string().nullable(),
                tipo: z.enum(["entrega", "retirada"]),
                valor_em_centavos: z.number().int().nonnegative(),
              })
              .strict(),
          )
          .max(50),
        produto: z.string(),
        variante: z.string().nullable(),
      })
      .strict()
      .nullable(),
  })
  .strict();
