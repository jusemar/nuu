import type { ContextoPersistidoOrquestrador } from "./orquestrador";

export type ConfiguracaoContexto = {
  limiteTokens: number;
  limiarAtualizacaoResumoTokens: number;
  limiarPrimeiroResumoTokens: number;
};

export type ContextoControlado = {
  dados: {
    estado: ContextoPersistidoOrquestrador["estado"];
    fontesInstitucionais?: {
      conflito: boolean;
      fontes: Array<{
        conteudo: string;
        pontuacaoFinal: number;
        secao: string | null;
        titulo: string;
        versao: number;
      }>;
      status: "fonte_encontrada" | "fonte_ausente" | "conflito";
    };
    memoriaPermitida: Array<
      Omit<
        ContextoPersistidoOrquestrador["memoriaPermitida"][number],
        "assuntoNormalizado" | "id"
      >
    >;
    mensagemAtual: Omit<ContextoPersistidoOrquestrador["mensagemAtual"], "id">;
    mensagensAnteriores: Array<
      Omit<ContextoPersistidoOrquestrador["mensagensAnteriores"][number], "id">
    >;
    resultadosFerramentas: ContextoPersistidoOrquestrador["resultadosFerramentas"];
    resumo: null | { conteudo: string; resumoEstruturado: Record<string, unknown>; versao: number };
  };
  mensagensDescartadas: number;
  tokensEstimados: number;
};

export type DecisaoResumo =
  | { tipo: "nao_gerar" }
  | { mensagens: ContextoPersistidoOrquestrador["mensagensAnteriores"]; tipo: "gerar" | "atualizar" };
