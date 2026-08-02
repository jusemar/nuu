import type { ContextoPersistidoOrquestrador, MensagemContextoOrquestrador } from "./orquestrador";

export type ResumoGerado = {
  conteudo: string;
  duracaoEmMs: number;
  resumoEstruturado: Record<string, unknown>;
  respostaId: string;
  tokensEntrada: number;
  tokensSaida: number;
};

export interface GeradorResumoContexto {
  gerar(dados: {
    identificadorSeguranca: string;
    mensagens: MensagemContextoOrquestrador[];
    resumoAnterior: ContextoPersistidoOrquestrador["resumo"];
  }): Promise<ResumoGerado>;
}

export interface RepositorioResumoContexto {
  buscarResumoPorExecucao(
    execucaoId: string,
  ): Promise<ContextoPersistidoOrquestrador["resumo"]>;
  persistirResumo(dados: {
    ateMensagemId: string;
    conteudo: string;
    conversaId: string;
    execucaoId: string;
    hashConteudoConsiderado: string;
    quantidadeMensagens: number;
    resumoEstruturado: Record<string, unknown>;
    resumoAnteriorVersao: number | null;
  }): Promise<ContextoPersistidoOrquestrador["resumo"]>;
  registrarAuditoriaResumo(dados: {
    conversaId: string;
    duracaoEmMs: number;
    execucaoId: string;
    status: "concluida" | "falhou";
    tokensEntrada: number;
    tokensSaida: number;
    versao: number | null;
  }): Promise<void>;
}
