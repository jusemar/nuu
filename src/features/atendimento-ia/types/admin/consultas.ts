export type PaginaAdmin<T> = {
  itens: T[];
  limite: number;
  pagina: number;
  total: number;
  totalPaginas: number;
};
export type ConhecimentoInstitucionalDto = {
  atualizadoEm: string;
  autor: string | null;
  categoria: string;
  chaveEstavel: string;
  estado: string | null;
  fragmentos: number;
  id: string;
  indexacao: string | null;
  origem: string;
  publicado: boolean;
  revisadoEm: string | null;
  situacao: "ativa" | "arquivada";
  titulo: string;
  tipoConhecimento: "institucional" | "pergunta_resposta";
  versaoAtualAtualizadaEm: string | null;
  versaoAtualId: string | null;
  versaoAtual: number | null;
};
export type ConversaRevisaoDto = {
  avaliada: boolean;
  criadoEm: string;
  duracaoEmMs: number | null;
  identificador: string;
  referencia: string;
  modelo: string | null;
  ocorrencia: boolean;
  quantidadeMensagens: number;
  status: string;
  statusProcessamento: string | null;
  transferencia: boolean;
};
export type MensagemSanitizadaDto = {
  autor: string;
  conteudo: string;
  criadoEm: string;
  referencia: string;
  status: string;
};
export type FerramentaSanitizadaDto = {
  classificacao: string;
  duracaoEmMs: number | null;
  nome: string;
  status: string;
};
export type ExecucaoSanitizadaDto = {
  concluidoEm: string | null;
  duracaoEmMs: number | null;
  ferramentas: FerramentaSanitizadaDto[];
  iniciadoEm: string;
  modelo: string;
  status: string;
  tokensEntrada: number;
  tokensSaida: number;
};
export type ConversaSanitizadaDto = {
  avaliacoes: Array<{ nota: number | null; origem: string }>;
  criadoEm: string;
  execucoes: ExecucaoSanitizadaDto[];
  fontesRag: Array<{ conflito: boolean; fontes: number; status: string }>;
  identificador: string;
  referencia: string;
  mensagens: MensagemSanitizadaDto[];
  ocorrencias: Array<{ descricao: string; tipo: string }>;
  status: string;
  transferencias: Array<{ canal: string; motivo: string; status: string }>;
};
