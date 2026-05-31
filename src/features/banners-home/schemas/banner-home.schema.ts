import { z } from "zod";

const textoOpcionalSchema = z
  .string()
  .trim()
  .optional()
  .transform((valor) => (valor ? valor : null));

export const salvarBannerHomeSchema = z
  .object({
    id: z.string().uuid().optional(),
    posicao: z.enum(["principal_esquerdo", "secundario_direito"], {
      error: "Escolha a posição onde este banner será exibido na Home.",
    }),
    tipoBanner: z.enum(["svg", "imagem"]).default("svg"),
    ativo: z.boolean().default(false),
    titulo: textoOpcionalSchema,
    subtitulo: textoOpcionalSchema,
    textoApoio: textoOpcionalSchema,
    precoChamada: textoOpcionalSchema,
    textoBotao: textoOpcionalSchema,
    linkBotao: textoOpcionalSchema,
    imagemUrl: textoOpcionalSchema,
    imagemAlt: textoOpcionalSchema,
    imagemMobileUrl: textoOpcionalSchema,
    focoImagem: z
      .enum(["center", "top", "bottom", "left", "right"])
      .default("center"),
    tamanhoImagem: z.enum(["cover", "contain"]).default("cover"),
    metadataImagem: z
      .object({
        largura: z.number().int().positive(),
        altura: z.number().int().positive(),
        proporcao: z.number().positive(),
        tamanhoBytes: z.number().int().positive(),
        tipoArquivo: z.string().min(1),
        nomeArquivo: z.string().min(1),
      })
      .nullable()
      .optional(),
    tipoDestaque: z.enum(["promocao", "oferta", "lancamento", "institucional"]),
    modeloSvg: z.enum([
      "ondas_comerciais",
      "formas_promocionais",
      "linhas_institucionais",
    ]),
    variacaoVisual: z.enum(["azul_ambar", "verde", "grafite"]),
    ordem: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((dados, contexto) => {
    if (dados.tipoBanner === "svg" && !dados.titulo) {
      contexto.addIssue({
        code: "custom",
        path: ["titulo"],
        message: "Informe o título principal do banner SVG.",
      });
    }

    if (dados.tipoBanner === "imagem") {
      if (!dados.imagemUrl) {
        contexto.addIssue({
          code: "custom",
          path: ["imagemUrl"],
          message: "Envie uma imagem para salvar um banner do tipo imagem.",
        });
      }
    }
  });

export const idBannerHomeSchema = z.string().uuid();

export const alternarStatusBannerHomeSchema = z.object({
  id: idBannerHomeSchema,
  ativo: z.boolean(),
});

export type SalvarBannerHomeEntrada = z.infer<typeof salvarBannerHomeSchema>;
