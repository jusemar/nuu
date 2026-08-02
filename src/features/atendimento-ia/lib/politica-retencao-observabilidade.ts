import type { ConfiguracaoSegurancaObservabilidade } from "../schemas/configuracao-seguranca-observabilidade.schema";

type ExecutorRetencao = {
  excluirAuditoriaPorRetencao(dados: { antesDe: Date; categoria: "operacao" | "seguranca" | "privacidade" | "integracao" | "limite" }): Promise<number>;
};

export async function executarRetencaoAuditoriaConfigurada(dados: {
  agora: Date;
  categoria: "operacao" | "seguranca" | "privacidade" | "integracao" | "limite";
  configuracao: ConfiguracaoSegurancaObservabilidade;
  executor: ExecutorRetencao;
}) {
  const dias = dados.configuracao.ATENDENTE_IA_RETENCAO_AUDITORIA_DIAS;
  if (!dias) return { executada: false as const, motivo: "PRAZO_NAO_CONFIGURADO" as const, removidos: 0 };
  const antesDe = new Date(dados.agora.getTime() - dias * 24 * 60 * 60 * 1000);
  const removidos = await dados.executor.excluirAuditoriaPorRetencao({ antesDe, categoria: dados.categoria });
  return { antesDe, executada: true as const, removidos };
}
