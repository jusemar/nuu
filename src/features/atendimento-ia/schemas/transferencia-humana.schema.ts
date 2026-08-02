import { z } from "zod";

import {
  ESTADOS_TRANSFERENCIA_WHATSAPP,
  MOTIVOS_TRANSFERENCIA_HUMANA,
} from "../constants/transferencia-humana";

const textoResumo = z.string().trim().min(1).max(300);

export const resumoTransferenciaSchema = z.object({
  fatos_verificados: z.array(textoResumo).max(5),
  identificador_seguro_atendimento: z.string().trim().min(8).max(80),
  informacoes_declaradas: z.array(textoResumo).max(5),
  interpretacao_necessidade: textoResumo,
  motivo: z.enum(MOTIVOS_TRANSFERENCIA_HUMANA),
  necessidade_principal: textoResumo,
  pendencia_validacao_humana: textoResumo,
  produto_ou_pedido_relacionado: textoResumo.nullable(),
}).strict();

export const configuracaoTransferenciaHumanaSchema = z.object({
  ATENDENTE_IA_WHATSAPP_OFICIAL: z.string().trim().optional(),
  ATENDENTE_IA_TRANSFERENCIA_VALIDADE_MS: z.coerce.number().int()
    .min(30_000).max(15 * 60 * 1000).optional().default(5 * 60 * 1000),
});

export const estadoTransferenciaWhatsappSchema = z.enum(
  ESTADOS_TRANSFERENCIA_WHATSAPP,
);

export const respostaRevisaoTransferenciaSchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("confirmar_oferta") }).strict(),
  z.object({ acao: z.literal("recusar") }).strict(),
  z.object({ acao: z.literal("confirmar_resumo"), resposta: z.literal("sim") }).strict(),
  z.object({ acao: z.literal("cancelar") }).strict(),
  z.object({ acao: z.literal("registrar_abertura") }).strict(),
]);

export const resultadoLinkWhatsappSchema = z.object({
  disponibilidade: z.object({
    mensagem: z.string().max(300),
    tipo: z.literal("nao_configurada"),
  }).strict(),
  link: z.string().url().max(4096).nullable(),
  numero_exibivel: z.string().nullable(),
  status: z.enum(["link_gerado", "configuracao_ausente", "configuracao_invalida", "falha_ao_gerar_link", "resultado_incerto"]),
}).strict();

export type ResumoTransferencia = z.infer<typeof resumoTransferenciaSchema>;
