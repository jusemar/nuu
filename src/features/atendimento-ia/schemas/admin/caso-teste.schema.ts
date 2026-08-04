import { z } from "zod";

export const ESTADOS_CASO_TESTE = [
  "rascunho",
  "em_revisao",
  "aprovado",
  "desativado",
] as const;
export const CRITICIDADES_CASO_TESTE = [
  "baixa",
  "media",
  "alta",
  "critica",
] as const;
export const CATEGORIAS_CASO_TESTE = [
  "conhecimento",
  "pergunta_resposta",
  "comportamento",
  "ferramenta",
  "integracao",
  "transferencia_humana",
  "seguranca",
  "privacidade",
  "fora_escopo",
  "experiencia_usuario",
] as const;
export const ORIGENS_DADOS_CASO_TESTE = [
  "ficticio",
  "snapshot_anonimizado",
] as const;

const textoCurto = z.string().trim().min(2).max(500);
const listaUnica = z
  .array(textoCurto)
  .max(30)
  .refine(
    (itens) =>
      new Set(itens.map((i) => i.toLocaleLowerCase())).size === itens.length,
    "Itens duplicados não são permitidos.",
  );
const contextoControladoSchema = z
  .record(z.string().max(80), z.unknown())
  .refine(
    (valor) => JSON.stringify(valor).length <= 12_000,
    "Contexto excede o limite permitido.",
  );

export const entradaControladaCasoTesteSchema = z
  .object({
    perguntaCliente: z.string().trim().min(1).max(4_000),
    historicoFicticio: z
      .array(
        z
          .object({
            autor: z.enum(["cliente", "assistente_ia"]),
            conteudo: z.string().trim().min(1).max(2_000),
          })
          .strict(),
      )
      .max(20)
      .default([]),
  })
  .strict();

export const expectativasCasoTesteSchema = z
  .object({
    assuntoEsperado: z.string().trim().min(2).max(300),
    comportamentoEsperado: z.string().trim().min(2).max(1_000),
    necessitaFonte: z.boolean(),
    necessitaFerramenta: z.boolean(),
    ferramentaEsperada: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .nullable()
      .default(null),
    necessitaTransferencia: z.boolean(),
    respostaExataObrigatoria: z.literal(false).default(false),
  })
  .strict()
  .superRefine((dados, contexto) => {
    if (dados.necessitaFerramenta !== Boolean(dados.ferramentaEsperada))
      contexto.addIssue({
        code: "custom",
        path: ["ferramentaEsperada"],
        message:
          "Informe a ferramenta esperada somente quando ela for necessária.",
      });
  });

export const conteudoVersaoCasoTesteSchema = z
  .object({
    entradaControlada: entradaControladaCasoTesteSchema,
    contextoSimulado: contextoControladoSchema.default({}),
    expectativas: expectativasCasoTesteSchema,
    ferramentasPermitidas: listaUnica.default([]),
    ferramentasProibidas: listaUnica.default([]),
    efeitosEsperados: z.literal("nenhum"),
    criterios: listaUnica.min(1),
    dadosOrigem: z.enum(ORIGENS_DADOS_CASO_TESTE).default("ficticio"),
    justificativaSnapshot: z
      .string()
      .trim()
      .min(20)
      .max(1_000)
      .nullable()
      .default(null),
    autorizacaoSnapshotConfirmada: z.boolean().default(false),
  })
  .strict()
  .superRefine((dados, contexto) => {
    const proibidas = new Set(dados.ferramentasProibidas);
    if (dados.ferramentasPermitidas.some((f) => proibidas.has(f)))
      contexto.addIssue({
        code: "custom",
        path: ["ferramentasPermitidas"],
        message: "Uma ferramenta não pode ser permitida e proibida.",
      });
    if (
      dados.dadosOrigem === "snapshot_anonimizado" &&
      (!dados.justificativaSnapshot || !dados.autorizacaoSnapshotConfirmada)
    )
      contexto.addIssue({
        code: "custom",
        path: ["dadosOrigem"],
        message: "Snapshot exige justificativa e autorização explícita.",
      });
    if (
      dados.dadosOrigem === "ficticio" &&
      (dados.justificativaSnapshot || dados.autorizacaoSnapshotConfirmada)
    )
      contexto.addIssue({
        code: "custom",
        path: ["dadosOrigem"],
        message: "Dados fictícios não usam autorização de snapshot.",
      });
  });

export const criarCasoTesteSchema = z
  .object({
    nome: z.string().trim().min(3).max(180),
    descricao: z.string().trim().min(10).max(2_000),
    categoria: z.enum(CATEGORIAS_CASO_TESTE),
    criticidade: z.enum(CRITICIDADES_CASO_TESTE),
    conteudo: conteudoVersaoCasoTesteSchema,
  })
  .strict();
export const criarVersaoCasoTesteSchema = z
  .object({
    casoTesteId: z.string().uuid(),
    conteudo: conteudoVersaoCasoTesteSchema,
  })
  .strict();
export const atualizarRascunhoCasoTesteSchema = z
  .object({
    versaoId: z.string().uuid(),
    atualizadoEmEsperado: z.coerce.date(),
    conteudo: conteudoVersaoCasoTesteSchema,
  })
  .strict();
export const enviarCasoTesteRevisaoSchema = z
  .object({
    versaoId: z.string().uuid(),
    atualizadoEmEsperado: z.coerce.date(),
  })
  .strict();
export const revisarCasoTesteSchema = z
  .object({
    versaoId: z.string().uuid(),
    atualizadoEmEsperado: z.coerce.date(),
    decisao: z.enum(["aprovada", "reprovada"]),
    motivo: z.string().trim().min(5).max(1_000).nullable().default(null),
  })
  .strict()
  .superRefine((d, c) => {
    if (d.decisao === "reprovada" && !d.motivo)
      c.addIssue({
        code: "custom",
        path: ["motivo"],
        message: "Informe o motivo da reprovação.",
      });
  });
export const desativarCasoTesteSchema = z
  .object({ casoTesteId: z.string().uuid() })
  .strict();

export const conjuntoTesteSchema = z
  .object({
    nome: z.string().trim().min(3).max(180),
    descricao: z.string().trim().min(10).max(2_000),
    finalidade: z.string().trim().min(5).max(1_000),
    criticidadeMinima: z.enum(CRITICIDADES_CASO_TESTE),
  })
  .strict();
export const criarConjuntoTesteSchema = conjuntoTesteSchema;
export const atualizarConjuntoTesteSchema = conjuntoTesteSchema
  .extend({
    conjuntoTesteId: z.string().uuid(),
    atualizadoEmEsperado: z.coerce.date(),
  })
  .strict();
export const vincularCasoConjuntoSchema = z
  .object({
    conjuntoTesteId: z.string().uuid(),
    casoTesteVersaoId: z.string().uuid(),
    obrigatorio: z.boolean(),
    bloqueiaPublicacao: z.boolean(),
  })
  .strict();
export const removerCasoConjuntoSchema = z
  .object({ vinculoId: z.string().uuid() })
  .strict();
export const reordenarCasosConjuntoSchema = z
  .object({
    conjuntoTesteId: z.string().uuid(),
    vinculosOrdenados: z
      .array(z.string().uuid())
      .min(1)
      .max(500)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Vínculos duplicados não são permitidos.",
      ),
  })
  .strict();
export const converterPropostaCasoTesteSchema = z
  .object({
    propostaId: z.string().uuid(),
    nome: z.string().trim().min(3).max(180),
    descricao: z.string().trim().min(10).max(2_000),
    categoria: z.enum(CATEGORIAS_CASO_TESTE),
    criticidade: z.enum(CRITICIDADES_CASO_TESTE),
    perguntaFicticia: z.string().trim().min(1).max(4_000),
    criterios: listaUnica.min(1),
  })
  .strict();

/** Contrato legado público do Bloco 1, mantido para compatibilidade. */
export const casoTesteAdminSchema = z
  .object({
    bloqueiaPublicacao: z.boolean(),
    contextoFicticio: z.record(z.string(), z.unknown()).default({}),
    criticidade: z.enum(CRITICIDADES_CASO_TESTE),
    efeitosReais: z.literal("proibidos"),
    entrada: z.string().trim().min(1).max(4_000),
    estado: z.enum(ESTADOS_CASO_TESTE).default("rascunho"),
    expectativas: listaUnica.min(1),
    ferramentasProibidas: listaUnica,
    ferramentasRequeridas: listaUnica,
    nome: z.string().trim().min(3).max(180),
  })
  .strict()
  .superRefine((dados, contexto) => {
    if (dados.criticidade === "critica" && !dados.bloqueiaPublicacao)
      contexto.addIssue({
        code: "custom",
        path: ["bloqueiaPublicacao"],
        message: "Casos críticos devem bloquear a publicação.",
      });
  });
