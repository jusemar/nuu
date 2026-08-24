import { z } from "zod";

export const enderecoLinkSchema = z
  .string()
  .trim()
  .max(2_048)
  .refine((valor) => {
    if (valor.startsWith("/") && !valor.startsWith("//")) return true;
    try {
      return ["https:", "http:", "mailto:", "tel:"].includes(
        new URL(valor).protocol,
      );
    } catch {
      return false;
    }
  }, "O link deve usar HTTPS, HTTP, e-mail, telefone ou caminho interno.");

const marcaConteudoSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }).strict(),
  z.object({ type: z.literal("italic") }).strict(),
  z
    .object({
      type: z.literal("link"),
      attrs: z
        .object({
          href: enderecoLinkSchema,
          target: z.enum(["_blank", "_self"]).nullable().optional(),
          rel: z.string().max(120).nullable().optional(),
          class: z.null().optional(),
        })
        .strict(),
    })
    .strict(),
]);

export type NoConteudo = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: NoConteudo[];
  marks?: Array<z.infer<typeof marcaConteudoSchema>>;
  text?: string;
};

const noConteudoSchema: z.ZodType<NoConteudo> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z
      .object({
        type: z.literal("doc"),
        content: z.array(noConteudoSchema).default([]),
      })
      .strict(),
    z
      .object({
        type: z.literal("paragraph"),
        content: z.array(noConteudoSchema).optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("heading"),
        attrs: z.object({ level: z.number().int().min(1).max(3) }).strict(),
        content: z.array(noConteudoSchema).optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("bulletList"),
        content: z.array(noConteudoSchema).min(1),
      })
      .strict(),
    z
      .object({
        type: z.literal("orderedList"),
        attrs: z
          .object({
            start: z.number().int().positive(),
            type: z.string().nullable().optional(),
          })
          .strict()
          .optional(),
        content: z.array(noConteudoSchema).min(1),
      })
      .strict(),
    z
      .object({
        type: z.literal("listItem"),
        content: z.array(noConteudoSchema).min(1),
      })
      .strict(),
    z
      .object({
        type: z.literal("text"),
        text: z.string().max(100_000),
        marks: z.array(marcaConteudoSchema).optional(),
      })
      .strict(),
  ]),
);

export const conteudoPaginaDinamicaSchema = noConteudoSchema
  .refine(
    (conteudo) => conteudo.type === "doc",
    "O conteúdo deve começar por um documento.",
  )
  .refine(
    (conteudo) => JSON.stringify(conteudo).length <= 1_000_000,
    "O conteúdo excede o limite de 1 MB.",
  );

export type ConteudoPaginaDinamica = z.infer<
  typeof conteudoPaginaDinamicaSchema
>;

export const CONTEUDO_PAGINA_VAZIO: ConteudoPaginaDinamica = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
