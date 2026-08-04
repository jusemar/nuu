import { z } from "zod";

import { comportamentoTomAdminSchema } from "./comportamento.schema";

export const configuracaoComportamentoEditorSchema = comportamentoTomAdminSchema
  .omit({ estado: true, resumoAlteracao: true, versaoNucleoProtegido: true })
  .extend({
    cordialidade: z.number().int().min(1).max(5),
    acolhimento: z.number().int().min(1).max(5),
    objetividade: z.number().int().min(1).max(5),
    linguagemSimples: z.boolean(),
    evitarLinguagemRobotica: z.boolean(),
    saudacao: z.string().trim().max(300),
    estruturaExplicacao: z.string().trim().max(1000),
    perguntas: z.string().trim().max(1000),
    recomendacoes: z.string().trim().max(1000),
    complementos: z.string().trim().max(1000),
    faltaInformacao: z.string().trim().max(1000),
    encaminhamentoHumano: z.string().trim().max(1000),
    palavrasPreferidas: z.array(z.string().trim().min(1).max(80)).max(30),
    palavrasEvitadas: z.array(z.string().trim().min(1).max(80)).max(30),
    tratamentoCliente: z.string().trim().max(500),
    regrasHumanizacao: z.array(z.string().trim().min(3).max(500)).max(20),
    naoPressionar: z.literal(true),
    naoAutoritaria: z.literal(true),
    naoInventarVantagem: z.literal(true),
    naoManipularUrgencia: z.literal(true),
    consultarDadosReais: z.literal(true),
    restringirAoEscopoLoja: z.literal(true),
    preservarSegurancaPrivacidade: z.literal(true),
    whatsappEditavel: z.literal(false),
    acoesAdministrativasPermitidas: z.literal(false),
  })
  .strict();
export const criarComportamentoSchema = z
  .object({
    nome: z.string().trim().min(3).max(120),
    descricao: z.string().trim().min(10).max(1000),
    configuracao: configuracaoComportamentoEditorSchema,
    motivoAlteracao: z.string().trim().min(5).max(500),
    resumoAlteracao: z.string().trim().min(5).max(500),
  })
  .strict();
export const criarVersaoComportamentoSchema = criarComportamentoSchema
  .omit({ nome: true, descricao: true })
  .extend({ comportamentoId: z.string().uuid() })
  .strict();
export const atualizarRascunhoComportamentoSchema =
  criarVersaoComportamentoSchema
    .omit({ comportamentoId: true })
    .extend({
      versaoId: z.string().uuid(),
      atualizadoEmEsperado: z.coerce.date(),
    })
    .strict();
export const enviarComportamentoRevisaoSchema = z
  .object({
    versaoId: z.string().uuid(),
    atualizadoEmEsperado: z.coerce.date(),
  })
  .strict();
export const revisarComportamentoSchema = enviarComportamentoRevisaoSchema
  .extend({
    decisao: z.enum(["aprovada", "reprovada"]),
    motivo: z.string().trim().min(5).max(1000),
  })
  .strict();
export const arquivarComportamentoSchema = z
  .object({ comportamentoId: z.string().uuid() })
  .strict();
