import { z } from "zod";

const diasRetencaoOpcional = z.coerce.number().int().min(1).max(3650).optional();

export const configuracaoSegurancaObservabilidadeSchema = z.object({
  ATENDENTE_IA_LIMITE_MENSAGENS_JANELA: z.coerce.number().int().min(1).max(300).default(20),
  ATENDENTE_IA_LIMITE_JANELA_SEGUNDOS: z.coerce.number().int().min(10).max(3600).default(60),
  ATENDENTE_IA_RETENCAO_AUDITORIA_DIAS: diasRetencaoOpcional,
  ATENDENTE_IA_RETENCAO_INVESTIGACAO_DIAS: diasRetencaoOpcional,
  ATENDENTE_IA_RETENCAO_LOGS_DIAS: diasRetencaoOpcional,
  ATENDENTE_IA_RETENCAO_METRICAS_DIAS: diasRetencaoOpcional,
});

export type ConfiguracaoSegurancaObservabilidade = z.infer<typeof configuracaoSegurancaObservabilidadeSchema>;
