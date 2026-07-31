import { z } from "zod";

const flagAmbienteSchema = z
  .enum(["true", "false"])
  .optional()
  .transform((valor) => valor === "true");

export const configuracaoAtendenteIaAmbienteSchema = z.object({
  ATENDENTE_IA_ATIVO: flagAmbienteSchema,
  ATENDENTE_IA_FERRAMENTAS_ATIVAS: flagAmbienteSchema,
  ATENDENTE_IA_MEMORIA_ATIVA: flagAmbienteSchema,
  ATENDENTE_IA_ESCALONAMENTO_ATIVO: flagAmbienteSchema,
  ATENDENTE_IA_RAG_ATIVO: flagAmbienteSchema,
  ATENDENTE_IA_ACOES_ATIVAS: flagAmbienteSchema,
  ATENDENTE_IA_RECURSOS_EXPERIMENTAIS_ATIVOS: flagAmbienteSchema,
});

export type ConfiguracaoAtendenteIaAmbiente = z.infer<
  typeof configuracaoAtendenteIaAmbienteSchema
>;
