import type { ResultadoFerramentaProtegida } from "./ferramentas-protegidas";

export type VinculoOperacaoConfirmada = {
  acao: string;
  conversaId: string;
  execucaoId: string;
  ferramenta: string;
  parametrosEssenciais: Record<string, unknown>;
  recursoId: string;
  recursoTipo: string;
  referenciaSessaoHash: string;
  usuarioId: string | null;
};

export type ConfirmacaoFerramenta = VinculoOperacaoConfirmada & {
  expiraEm: Date;
  hashParametros: string;
  id: string;
  status: "pendente" | "confirmada" | "consumida" | "cancelada" | "expirada" | "invalidada";
};

export interface RepositorioConfirmacoesFerramentas {
  buscar(id: string): Promise<ConfirmacaoFerramenta | null>;
  cancelarPendentes(dados: Pick<VinculoOperacaoConfirmada, "conversaId" | "usuarioId">): Promise<number>;
  confirmarUnica(dados: {
    agora: Date;
    conversaId: string;
    referenciaSessaoHash: string;
    usuarioId: string | null;
  }): Promise<ConfirmacaoFerramenta | null>;
  consumir(dados: { agora: Date; confirmacaoId: string; hashParametros: string }): Promise<boolean>;
  criar(dados: VinculoOperacaoConfirmada & { expiraEm: Date; hashParametros: string }): Promise<ConfirmacaoFerramenta>;
  expirar(agora: Date): Promise<number>;
  invalidarDivergentes(dados: VinculoOperacaoConfirmada & { hashParametros: string }): Promise<number>;
  reivindicarOperacao(dados: {
    chaveIdempotencia: string;
    confirmacao: ConfirmacaoFerramenta;
    execucaoId: string;
  }): Promise<
    | { tipo: "adquirida"; operacaoId: string }
    | { tipo: "concluida"; resultado: ResultadoFerramentaProtegida }
    | { tipo: "resultado_incerto" }
    | { tipo: "em_processamento" }
  >;
  concluirOperacao(dados: { operacaoId: string; resultado: ResultadoFerramentaProtegida }): Promise<void>;
  falharOperacao(dados: { operacaoId: string; resultadoIncerto: boolean }): Promise<void>;
  auditar(evento: string, dados: Record<string, unknown>): Promise<void>;
}
