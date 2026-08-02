import type {
  ConversaEntradaAtendimento,
  EstadoMensagemAtendimento,
  IdentidadeEntradaAtendimento,
} from "./entrada-mensagem";
import type { ResultadoRecuperacaoRag } from "./rag";

export type MensagemContextoOrquestrador = {
  autor: "cliente" | "assistente_ia" | "atendente_humano" | "sistema";
  conteudo: string;
  criadoEm: Date;
  id: string;
  status: EstadoMensagemAtendimento;
};

export type ContextoPersistidoOrquestrador = {
  conversa: ConversaEntradaAtendimento;
  estado: {
    estadoEstruturado: Record<string, unknown>;
    etapaAtual: string | null;
    intencaoAtual: string | null;
    versao: number;
  };
  memoriaPermitida: Array<{
    categoria: string;
    origem:
      | "informada_cliente"
      | "confirmada_sistema"
      | "inferida_ia"
      | "acao_solicitada"
      | "acao_concluida"
      | "informacao_vencida"
      | "informacao_possivelmente_desatualizada";
    valorEstruturado: Record<string, unknown>;
    assuntoNormalizado: string;
    id: string;
  }>;
  mensagemAtual: MensagemContextoOrquestrador;
  mensagensAnteriores: MensagemContextoOrquestrador[];
  resumo: {
    ateMensagemId: string | null;
    conteudo: string;
    resumoEstruturado: Record<string, unknown>;
    criadoEm: Date;
    hashConteudoConsiderado: string;
    quantidadeMensagens: number;
    versao: number;
  } | null;
  resultadosFerramentas: Array<{
    nome: string;
    resultado: Record<string, unknown>;
    versao: string;
  }>;
  fontesInstitucionais?: ResultadoRecuperacaoRag;
};

export type MetadadosExecucaoModelo = {
  duracaoEmMs: number;
  modelo: "gpt-5.6-terra" | "gpt-5.6-sol";
  motivoEscalonamento: CriterioEscalonamentoModelo | null;
  respostaId: string;
  requestId?: string | null;
  tokensEntrada: number;
  tokensSaida: number;
};

export type CriterioEscalonamentoModelo =
  | "requisitos_numerosos_ou_conflitantes"
  | "dificuldade_compreensao_modelo_principal"
  | "recomendacao_maior_risco"
  | "falha_validacao_resposta"
  | "necessidade_analise_mais_cuidadosa";

export type ResultadoComponenteOrquestrado =
  | {
      conteudoResposta: string;
      metadados: MetadadosExecucaoModelo;
      tipo: "encaminhar_geracao_resposta";
    }
  | {
      metadados: MetadadosExecucaoModelo;
      tipo: "aguardar_ferramenta";
    }
  | {
      explicacaoOferta: string;
      metadados: MetadadosExecucaoModelo;
      motivo: import("./transferencia-humana").MotivoTransferenciaHumana;
      tipo: "aguardar_atendimento_humano";
    };

export interface ComponenteProcessamentoOrquestrado {
  processar(dados: {
    contexto: ContextoPersistidoOrquestrador;
    execucaoId: string;
  }): Promise<ResultadoComponenteOrquestrado>;
}

export class FalhaComponenteOrquestrado extends Error {
  constructor(
    public readonly classificacao: "recuperavel" | "definitiva",
    public readonly tipo:
      | "modelo_indisponivel"
      | "ferramenta_indisponivel"
      | "integracao_indisponivel"
      | "falta_autorizacao"
      | "limite_excedido"
      | "ausencia_dado_oficial"
      | "conflito_fontes"
      | "erro_interno",
  ) {
    super(`${classificacao}:${tipo}`);
  }
}

export type ResultadoOrquestracao =
  | {
      execucaoId: string;
      estado: "aguardando_ferramenta" | "gerando_resposta";
      mensagemRespostaId: string | null;
      requestId: string | null;
      tipo: "encaminhada";
    }
  | {
      execucaoId: string;
      estado: "aguardando_atendimento_humano";
      transferenciaId: string;
      requestId: string | null;
      tipo: "aguardando_atendimento_humano";
    }
  | {
      execucaoId: string;
      estado: "processando";
      tipo: "falha_recuperavel";
    }
  | {
      execucaoId: string;
      estado: "falhou";
      tipo: "falha_definitiva";
    }
  | {
      execucaoId: string | null;
      estado: EstadoMensagemAtendimento;
      tipo: "em_processamento" | "ja_concluida";
    }
  | {
      estado: EstadoMensagemAtendimento;
      tipo: "estado_incompativel";
    };

export type ReivindicacaoOrquestracao =
  | {
      contexto: ContextoPersistidoOrquestrador;
      execucaoId: string;
      tipo: "adquirida";
    }
  | {
      execucaoId: string | null;
      estado: EstadoMensagemAtendimento;
      tipo: "em_processamento" | "ja_concluida";
    }
  | {
      estado: EstadoMensagemAtendimento;
      tipo: "estado_incompativel";
    };

export interface RepositorioOrquestrador {
  reivindicarProcessamento(dados: {
    contextoExpiraAposDias?: number;
    identidade: IdentidadeEntradaAtendimento;
    memoriaAtiva: boolean;
    memoriaExpiraAposDias?: number;
    mensagemId: string;
  }): Promise<ReivindicacaoOrquestracao>;
  concluirEncaminhamento(dados: {
    execucaoId: string;
    mensagemId: string;
    proximoEstado:
      | "aguardando_ferramenta"
      | "gerando_resposta"
      | "aguardando_atendimento_humano";
    resultado: ResultadoComponenteOrquestrado;
  }): Promise<{ mensagemRespostaId: string | null; transferenciaId?: string | null }>;
  registrarFalha(dados: {
    classificacao: "recuperavel" | "definitiva";
    execucaoId: string;
    mensagemId: string;
    tipo: FalhaComponenteOrquestrado["tipo"];
  }): Promise<void>;
}
