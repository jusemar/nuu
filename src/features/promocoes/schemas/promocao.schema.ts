import { z } from "zod";

import {
  statusPromocao,
  tiposBeneficioPromocao,
  tiposCampanhaPromocao,
  tiposDescontoPromocao,
} from "../types/promocoes.types";

export const tipoDescontoPromocaoSchema = z.enum(tiposDescontoPromocao);
export const statusPromocaoSchema = z.enum(statusPromocao);
export const tipoCampanhaPromocaoSchema = z.enum(tiposCampanhaPromocao);
export const tipoBeneficioPromocaoSchema = z.enum(tiposBeneficioPromocao);

export const itemEntradaPromocaoSchema = z.object({
  produtoId: z.string().uuid(),
  modalidade: z.string().trim().min(1).nullable().optional(),
  categoriaId: z.string().uuid().nullable().optional(),
  marcaId: z.string().uuid().nullable().optional(),
  quantidade: z.number().int().positive(),
  precoBaseEmCentavos: z.number().int().min(0),
});

export const regraPromocaoCalculavelSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1),
  slug: z.string().min(1),
  status: statusPromocaoSchema,
  tipoBeneficio: tipoBeneficioPromocaoSchema.default("desconto"),
  tipoCampanha: tipoCampanhaPromocaoSchema.default("normal"),
  tipoDesconto: tipoDescontoPromocaoSchema,
  prioridade: z.number().int(),
  acumulativa: z.boolean(),
  dataInicio: z.date(),
  dataFim: z.date().nullable(),
  badgePromocional: z.string().nullable().default(null),
  countdownPromocionalDataFim: z.date().nullable().default(null),
});

export const vinculoProdutoPromocaoCalculavelSchema = z.object({
  id: z.string().uuid(),
  regraPromocaoId: z.string().uuid(),
  produtoId: z.string().uuid(),
  modalidade: z.string().trim().min(1).nullable().default(null),
  tipoDesconto: tipoDescontoPromocaoSchema,
  valorDesconto: z.number().int().min(0),
});

const produtoPromocaoAdminSchema = z.object({
  produtoId: z.string().uuid(),
  modalidade: z.string().trim().min(1).nullable().default(null),
});

export const vinculoCategoriaPromocaoCalculavelSchema = z.object({
  id: z.string().uuid(),
  regraPromocaoId: z.string().uuid(),
  categoriaId: z.string().uuid(),
  tipoDesconto: tipoDescontoPromocaoSchema,
  valorDesconto: z.number().int().min(0),
});

export const vinculoMarcaPromocaoCalculavelSchema = z.object({
  id: z.string().uuid(),
  regraPromocaoId: z.string().uuid(),
  marcaId: z.string().uuid(),
  tipoDesconto: tipoDescontoPromocaoSchema,
  valorDesconto: z.number().int().min(0),
});

export const regraSubtotalPromocaoCalculavelSchema = z.object({
  id: z.string().uuid(),
  regraPromocaoId: z.string().uuid(),
  subtotalMinimo: z.number().int().min(0),
  subtotalMaximo: z.number().int().min(0).nullable(),
  tipoDesconto: tipoDescontoPromocaoSchema,
  valorDesconto: z.number().int().min(0),
});

export const regraFreteGratisPromocaoCalculavelSchema = z.object({
  id: z.string().uuid(),
  regraPromocaoId: z.string().uuid(),
  subtotalMinimo: z.number().int().min(0),
  modalidade: z.string().trim().min(1).nullable(),
  mensagemProgressiva: z.string().trim().nullable(),
  regiaoCodigo: z.string().trim().nullable(),
  transportadoraCodigo: z.string().trim().nullable(),
  servicoCodigo: z.string().trim().nullable(),
});

export const cupomPromocaoCalculavelSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string().min(1),
  nome: z.string().min(1),
  ativo: z.boolean(),
  tipoDesconto: tipoDescontoPromocaoSchema,
  valorDesconto: z.number().int().min(0),
  freteGratis: z.boolean(),
  prioridade: z.number().int(),
  acumulativo: z.boolean(),
  subtotalMinimo: z.number().int().min(0),
  limiteUsoTotal: z.number().int().positive().nullable(),
  limiteUsoPorCliente: z.number().int().positive().nullable(),
  totalUsos: z.number().int().min(0),
  usosCliente: z.number().int().min(0),
  dataInicio: z.date(),
  dataFim: z.date().nullable(),
});

export const entradaCalculoPromocoesSchema = z.object({
  itens: z.array(itemEntradaPromocaoSchema),
  regras: z.array(regraPromocaoCalculavelSchema).optional(),
  produtosPromocao: z.array(vinculoProdutoPromocaoCalculavelSchema).optional(),
  categoriasPromocao: z
    .array(vinculoCategoriaPromocaoCalculavelSchema)
    .optional(),
  marcasPromocao: z.array(vinculoMarcaPromocaoCalculavelSchema).optional(),
  subtotaisPromocao: z.array(regraSubtotalPromocaoCalculavelSchema).optional(),
  fretesGratisPromocao: z
    .array(regraFreteGratisPromocaoCalculavelSchema)
    .optional(),
  cuponsPromocao: z.array(cupomPromocaoCalculavelSchema).optional(),
  contexto: z
    .object({
      dataReferencia: z.date().optional(),
      subtotalEmCentavos: z.number().int().min(0).nullable().optional(),
      codigosCupons: z.array(z.string().trim().min(1)).optional(),
      clienteId: z.string().uuid().nullable().optional(),
    })
    .optional(),
});

export const salvarPromocaoAdminSchema = z
  .object({
    id: z.string().uuid().optional(),
    nome: z.string().trim().min(3, "Informe um nome para a promoção."),
    slug: z
      .string()
      .trim()
      .min(3, "Informe um slug para a promoção.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use apenas letras minúsculas, números e hífens.",
      ),
    status: statusPromocaoSchema,
    tipoBeneficio: tipoBeneficioPromocaoSchema.default("desconto"),
    tipoCampanha: tipoCampanhaPromocaoSchema.default("normal"),
    tipoDesconto: tipoDescontoPromocaoSchema,
    valorDesconto: z.coerce.number().int().min(0),
    prioridade: z.coerce.number().int().min(0),
    acumulativa: z.coerce.boolean(),
    dataInicio: z.preprocess(
      (valor) => (valor ? new Date(valor as string | Date) : undefined),
      z.date({ error: "Informe a data inicial." }),
    ),
    dataFim: z.preprocess(
      (valor) => (valor ? new Date(valor as string | Date) : null),
      z.date().nullable(),
    ),
    badgePromocional: z.string().trim().max(80).nullable().optional(),
    countdownPromocionalDataFim: z.preprocess(
      (valor) => (valor ? new Date(valor as string | Date) : null),
      z.date().nullable().optional(),
    ),
    produtos: z.array(produtoPromocaoAdminSchema).default([]),
    produtosIds: z.array(z.string().uuid()).default([]),
    categoriasIds: z.array(z.string().uuid()).default([]),
    marcasIds: z.array(z.string().uuid()).default([]),
    subtotalMinimo: z.coerce.number().int().min(0).nullable().optional(),
    subtotalMaximo: z.coerce.number().int().min(0).nullable().optional(),
    freteGratisSubtotalMinimo: z.coerce
      .number()
      .int()
      .min(0)
      .nullable()
      .optional(),
    freteGratisModalidade: z.string().trim().min(1).nullable().optional(),
    freteGratisRegiaoCodigo: z.string().trim().min(1).nullable().optional(),
    freteGratisTransportadoraCodigo: z
      .string()
      .trim()
      .min(1)
      .nullable()
      .optional(),
    freteGratisServicoCodigo: z.string().trim().min(1).nullable().optional(),
    freteGratisMensagemProgressiva: z
      .string()
      .trim()
      .max(160)
      .nullable()
      .optional(),
  })
  .superRefine((dados, contexto) => {
    if (
      dados.tipoBeneficio === "desconto" &&
      dados.tipoDesconto === "percentual" &&
      dados.valorDesconto > 100
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["valorDesconto"],
        message: "Desconto percentual não pode ser maior que 100%.",
      });
    }

    if (dados.tipoBeneficio === "desconto" && dados.valorDesconto <= 0) {
      contexto.addIssue({
        code: "custom",
        path: ["valorDesconto"],
        message: "Informe um valor de desconto maior que zero.",
      });
    }

    if (dados.dataFim && dados.dataFim <= dados.dataInicio) {
      contexto.addIssue({
        code: "custom",
        path: ["dataFim"],
        message: "Data final deve ser maior que a data inicial.",
      });
    }

    if (dados.tipoCampanha === "relampago" && !dados.dataFim) {
      contexto.addIssue({
        code: "custom",
        path: ["dataFim"],
        message: "Promoção relâmpago precisa ter data final.",
      });
    }

    const produtosSelecionados =
      dados.produtos.length > 0
        ? dados.produtos
        : dados.produtosIds.map((produtoId) => ({
            produtoId,
            modalidade: null,
          }));
    const produtosUnicos = new Set(
      produtosSelecionados.map(
        (produto) => `${produto.produtoId}:${produto.modalidade ?? "todas"}`,
      ),
    );
    const categoriasUnicas = new Set(dados.categoriasIds);
    const marcasUnicas = new Set(dados.marcasIds);

    if (produtosUnicos.size !== produtosSelecionados.length) {
      contexto.addIssue({
        code: "custom",
        path: ["produtosIds"],
        message: "A promoção não pode conter produtos duplicados.",
      });
    }

    if (categoriasUnicas.size !== dados.categoriasIds.length) {
      contexto.addIssue({
        code: "custom",
        path: ["categoriasIds"],
        message: "A promoção não pode conter categorias duplicadas.",
      });
    }

    if (marcasUnicas.size !== dados.marcasIds.length) {
      contexto.addIssue({
        code: "custom",
        path: ["marcasIds"],
        message: "A promoção não pode conter marcas duplicadas.",
      });
    }

    if (
      dados.subtotalMinimo !== null &&
      dados.subtotalMinimo !== undefined &&
      dados.subtotalMaximo !== null &&
      dados.subtotalMaximo !== undefined &&
      dados.subtotalMaximo <= dados.subtotalMinimo
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["subtotalMaximo"],
        message: "Subtotal máximo deve ser maior que o subtotal mínimo.",
      });
    }

    const possuiSubtotal =
      dados.subtotalMinimo !== null && dados.subtotalMinimo !== undefined;
    const possuiFreteGratis =
      dados.tipoBeneficio === "frete_gratis" &&
      dados.freteGratisSubtotalMinimo !== null &&
      dados.freteGratisSubtotalMinimo !== undefined;
    const possuiAbrangencia =
      produtosSelecionados.length > 0 ||
      dados.categoriasIds.length > 0 ||
      dados.marcasIds.length > 0 ||
      possuiSubtotal ||
      possuiFreteGratis;

    if (
      dados.tipoBeneficio === "frete_gratis" &&
      (dados.freteGratisSubtotalMinimo === null ||
        dados.freteGratisSubtotalMinimo === undefined)
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["freteGratisSubtotalMinimo"],
        message: "Informe o subtotal mínimo para frete grátis.",
      });
    }

    if (!possuiAbrangencia) {
      contexto.addIssue({
        code: "custom",
        path: ["produtosIds"],
        message:
          "Selecione pelo menos um produto, categoria, marca ou faixa de subtotal.",
      });
    }
  });

export const filtrosPromocoesAdminSchema = z.object({
  busca: z.string().trim().optional(),
  status: statusPromocaoSchema.or(z.literal("todos")).optional(),
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().min(5).max(50).default(10),
});

export const filtrosCuponsPromocaoAdminSchema = z.object({
  busca: z.string().trim().optional(),
  status: z.enum(["todos", "ativos", "inativos"]).optional(),
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().min(5).max(50).default(10),
});

export const filtrosAuditoriaCuponsAdminSchema = z.object({
  busca: z.string().trim().optional(),
  codigoCupom: z.string().trim().optional(),
  numeroPedido: z.string().trim().optional(),
  cliente: z.string().trim().optional(),
  statusPagamento: z
    .enum(["todos", "pending", "paid", "failed", "expired"])
    .optional(),
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().min(5).max(50).default(10),
});

export const filtrosExportacaoAuditoriaCuponsAdminSchema = z.object({
  periodoInicio: z.string().trim().optional(),
  periodoFim: z.string().trim().optional(),
  statusPagamento: z
    .enum(["todos", "pending", "paid", "failed", "expired"])
    .optional(),
  codigoCupom: z.string().trim().optional(),
  gateway: z.enum(["todos", "stripe", "efibank"]).optional(),
  inconsistencia: z
    .enum([
      "todas",
      "pedido_pago_sem_uso",
      "uso_sem_pagamento_aprovado",
      "uso_duplicado",
      "webhook_com_falha",
    ])
    .optional(),
});

export const salvarCupomPromocaoAdminSchema = z
  .object({
    id: z.string().uuid().optional(),
    codigo: z
      .string()
      .trim()
      .min(3, "Informe um código para o cupom.")
      .transform((valor) => valor.toUpperCase())
      .refine(
        (valor) => /^[A-Z0-9_-]+$/.test(valor),
        "Use apenas letras, números, hífen e underline.",
      ),
    nome: z.string().trim().min(3, "Informe um nome para o cupom."),
    ativo: z.coerce.boolean(),
    tipoDesconto: tipoDescontoPromocaoSchema,
    valorDesconto: z.coerce.number().int().positive(),
    freteGratis: z.coerce.boolean().default(false),
    prioridade: z.coerce.number().int().min(0),
    acumulativo: z.coerce.boolean(),
    subtotalMinimo: z.coerce.number().int().min(0).default(0),
    limiteUsoTotal: z.coerce.number().int().positive().nullable().optional(),
    limiteUsoPorCliente: z.coerce
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),
    dataInicio: z.preprocess(
      (valor) => (valor ? new Date(valor as string | Date) : undefined),
      z.date({ error: "Informe a data inicial." }),
    ),
    dataFim: z.preprocess(
      (valor) => (valor ? new Date(valor as string | Date) : null),
      z.date().nullable(),
    ),
  })
  .superRefine((dados, contexto) => {
    if (dados.tipoDesconto === "percentual" && dados.valorDesconto > 100) {
      contexto.addIssue({
        code: "custom",
        path: ["valorDesconto"],
        message: "Desconto percentual não pode ser maior que 100%.",
      });
    }

    if (dados.dataFim && dados.dataFim <= dados.dataInicio) {
      contexto.addIssue({
        code: "custom",
        path: ["dataFim"],
        message: "Data final deve ser maior que a data inicial.",
      });
    }
  });

export const buscarProdutosPromocaoAdminSchema = z.object({
  busca: z.string().trim().min(2),
  limite: z.coerce.number().int().min(1).max(20).default(8),
});

export const buscarCategoriasPromocaoAdminSchema = z.object({
  busca: z.string().trim().min(2),
  limite: z.coerce.number().int().min(1).max(20).default(8),
});

export const buscarRegioesPromocaoAdminSchema = z.object({
  busca: z.string().trim().min(2),
  limite: z.coerce.number().int().min(1).max(30).default(10),
});

export const buscarFretesServicosPromocaoAdminSchema = z.object({
  busca: z.string().trim().min(2),
  limite: z.coerce.number().int().min(1).max(30).default(10),
});

export const buscarMarcasPromocaoAdminSchema = z.object({
  busca: z.string().trim().min(2),
  limite: z.coerce.number().int().min(1).max(20).default(8),
});

export const marcarLegadoRelampagoMigradoAdminSchema = z.object({
  produtoId: z.string().uuid(),
  modalidade: z.string().trim().min(1),
});

export const idPromocaoAdminSchema = z.string().uuid();
