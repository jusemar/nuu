// Schemas Zod para validação de Retirada Local
// Validação dupla: client + server
// Regra: nunca usar useState para formulário — usar react-hook-form + zod

import { z } from "zod";

// ============================================
// SCHEMAS BASE (reutilizáveis)
// ============================================

const horaSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
  message: "Horário deve estar no formato HH:MM",
});

const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

// ============================================
// SCHEMA: CONFIGURAÇÃO DE HORÁRIO
// ============================================

export const configHorarioSchema = z.object({
  horaAbertura: horaSchema,
  horaFechamento: horaSchema,
  usaIntervaloAlmoco: z.boolean().default(false),
  horaAlmocoInicio: horaSchema.nullable().optional(),
  horaAlmocoFim: horaSchema.nullable().optional(),
  diasFuncionamento: z
    .array(z.enum(diasSemana))
    .min(1, "Selecione pelo menos 1 dia de funcionamento"),
});

export const criarConfigHorarioSchema = configHorarioSchema;

export const atualizarConfigHorarioSchema = configHorarioSchema.partial();

// ============================================
// SCHEMA: FERIADO
// ============================================

export const feriadoSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Data deve estar no formato YYYY-MM-DD",
  }),
  descricao: z.string().min(1, "Descrição é obrigatória").max(100),
});

export const criarFeriadoSchema = feriadoSchema;

export const atualizarFeriadoSchema = feriadoSchema.partial();

// ============================================
// SCHEMA: MODALIDADE DE RETIRADA
// ============================================

export const modalidadeConfigSchema = z
  .object({
    horarioCorte: horaSchema.optional(),
    prazoDias: z.number().int().min(0).optional(),
    tipoContagem: z.enum(["uteis", "corridos"]).optional(),
  })
  .refine(
    (data) => {
      // Se tem prazoDias, deve ter tipoContagem
      if (data.prazoDias !== undefined && data.tipoContagem === undefined) {
        return false;
      }
      return true;
    },
    {
      message: "Tipo de contagem é obrigatório quando prazo em dias é definido",
      path: ["tipoContagem"],
    }
  );

export const modalidadeSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  ativo: z.boolean().default(true),
  config: modalidadeConfigSchema,
  mensagemPadrao: z.string().max(255).nullable().optional(),
});

export const criarModalidadeSchema = modalidadeSchema;

export const atualizarModalidadeSchema = modalidadeSchema.partial();

// ============================================
// SCHEMA: PONTO DE COLETA
// ============================================

export const pontoColetaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  endereco: z.string().min(1, "Endereço é obrigatório").max(255),
  cidade: z.string().min(1, "Cidade é obrigatória").max(100),
  estado: z.string().length(2, "Estado deve ter 2 caracteres (ex: MG)"),
  cep: z
    .string()
    .regex(/^\d{5}-\d{3}$|^\d{8}$/, "CEP deve estar no formato 00000-000 ou 00000000"),
  ativo: z.boolean().default(true),
  herdaHorarioGlobal: z.boolean().default(true),
});

export const criarPontoColetaSchema = pontoColetaSchema;

export const atualizarPontoColetaSchema = pontoColetaSchema.partial();

// ============================================
// SCHEMA: PRODUTO × RETIRADA (associação)
// ============================================

export const produtoRetiradaSchema = z.object({
  productId: z.string().uuid("ID do produto inválido"),
  pontoColetaId: z.string().uuid("ID do ponto inválido"),
  modalidadeId: z.string().uuid("ID da modalidade inválido"),
  mensagemPersonalizada: z.string().max(255).nullable().optional(),
});

export const criarProdutoRetiradaSchema = produtoRetiradaSchema;

export const atualizarProdutoRetiradaSchema = produtoRetiradaSchema.partial();

// ============================================
// SCHEMA: FORMULÁRIO DA ABA "ENTREGA" DO PRODUTO
// ============================================

export const formEntregaProdutoSchema = z.object({
  permiteRetirada: z.boolean(),
  pontosSelecionados: z.array(z.string().uuid()).min(1, "Selecione pelo menos 1 ponto"),
  modalidadeId: z.string().uuid("Selecione uma modalidade").nullable(),
  mensagemPersonalizada: z.string().max(255).optional(),
});

// ============================================
// TIPOS INFERIDOS DOS SCHEMAS (para usar no TypeScript)
// ============================================

export type ConfigHorarioInput = z.infer<typeof configHorarioSchema>;
export type FeriadoInput = z.infer<typeof feriadoSchema>;
export type ModalidadeInput = z.infer<typeof modalidadeSchema>;
export type PontoColetaInput = z.infer<typeof pontoColetaSchema>;
export type ProdutoRetiradaInput = z.infer<typeof produtoRetiradaSchema>;
export type FormEntregaProdutoInput = z.infer<typeof formEntregaProdutoSchema>;