export type CategoriaAuditoria = "operacao" | "seguranca" | "privacidade" | "integracao" | "limite";
export type SeveridadeAuditoria = "informativo" | "atencao" | "risco_relevante" | "critico";
export type ResultadoAuditoria = "sucesso_comprovado" | "recusa" | "falha" | "cancelamento" | "expiracao" | "parcial" | "incerto" | "indisponibilidade";

export type EventoAuditoriaSeguro = {
  acao?: string;
  autorizacao?: string;
  categoria: CategoriaAuditoria;
  codigoFalha?: string;
  conversaId?: string;
  correlacaoId: string;
  corrigeEventoId?: string;
  estadoAnterior?: string;
  estadoPosterior?: string;
  evento: string;
  execucaoFerramentaId?: string;
  execucaoId?: string;
  justificativaCorrecao?: string;
  mensagemId?: string;
  metadados?: Record<string, unknown>;
  referenciaSessaoHash?: string;
  resultado?: ResultadoAuditoria;
  severidade: SeveridadeAuditoria;
  tipoAtor: "sistema" | "cliente_autenticado" | "visitante" | "operador_interno";
  usuarioId?: string;
  versoes?: Record<string, string>;
};

export interface RepositorioSegurancaObservabilidade {
  registrar(evento: EventoAuditoriaSeguro): Promise<{ id: string; hashIntegridade: string }>;
  consumirLimite(dados: { agora: Date; escopo: "sessao" | "usuario" | "conversa" | "ferramenta"; limite: number; janelaEmMs: number; recurso: string; referencia: string }): Promise<{ permitido: boolean; quantidade: number }>;
}
