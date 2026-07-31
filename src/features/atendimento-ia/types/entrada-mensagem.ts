export type IdentidadeEntradaAtendimento = {
  identificadorSessao: string;
  usuarioId: string | null;
};

export type DadosEntradaMensagem = {
  canal: "site";
  chaveIdempotencia: string;
  conversaId?: string;
  mensagem: string;
};

export type ConversaEntradaAtendimento = {
  canal: "site";
  id: string;
  identificadorSessao: string;
  status: "ativa" | "aguardando_atendimento_humano" | "encerrada";
  usuarioId: string | null;
};

export type MensagemEntradaAtendimento = {
  conversaId: string;
  id: string;
  status: EstadoMensagemAtendimento;
};

export type EstadoMensagemAtendimento =
  | "recebida"
  | "validando"
  | "processando"
  | "aguardando_ferramenta"
  | "executando_ferramenta"
  | "gerando_resposta"
  | "concluida"
  | "falhou"
  | "aguardando_atendimento_humano";

export type ResultadoEntradaMensagem = {
  conversaId: string;
  duplicada: boolean;
  mensagemId: string;
  status: "processando";
};

export interface RepositorioEntradaAtendimento {
  executarAtomico<T>(
    operacao: (repositorio: RepositorioEntradaAtendimento) => Promise<T>,
  ): Promise<T>;
  buscarConversa(id: string): Promise<ConversaEntradaAtendimento | null>;
  criarConversa(
    identidade: IdentidadeEntradaAtendimento,
    canal: "site",
  ): Promise<ConversaEntradaAtendimento>;
  criarEstadoInicial(conversaId: string): Promise<void>;
  buscarMensagemPorIdempotencia(
    escopo: string,
    chave: string,
  ): Promise<{
    hashRequisicao: string;
    mensagem: MensagemEntradaAtendimento;
  } | null>;
  criarMensagemRecebida(dados: {
    chaveIdempotencia: string;
    conteudo: string;
    conversaId: string;
    identificadorCanal: string;
  }): Promise<MensagemEntradaAtendimento>;
  criarIdempotencia(dados: {
    chave: string;
    conversaId: string;
    escopo: string;
    expiraEm: Date;
    hashRequisicao: string;
    mensagemId: string;
  }): Promise<void>;
  concluirIdempotencia(
    escopo: string,
    chave: string,
    mensagemId: string,
  ): Promise<void>;
  atualizarEstadoMensagem(
    mensagemId: string,
    estado: EstadoMensagemAtendimento,
  ): Promise<void>;
  atualizarAtividadeConversa(conversaId: string): Promise<void>;
  registrarAuditoriaEntrada(dados: {
    conversaId: string;
    mensagemId: string;
    tipoAtor: "cliente_autenticado" | "visitante";
    identificadorAtor: string;
  }): Promise<void>;
}
