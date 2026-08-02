import type { z } from "zod";

import type { DefinicaoFerramentaOpenAi } from "./ferramentas-publicas";

export type NivelProtecaoFerramenta =
  | "publica"
  | "autenticada"
  | "confirmada"
  | "proibida";

export type StatusResultadoFerramentaProtegida =
  | "concluida"
  | "bloqueada"
  | "nao_autorizada"
  | "autenticacao_necessaria"
  | "confirmacao_necessaria"
  | "confirmacao_invalida"
  | "confirmacao_expirada"
  | "nao_encontrada"
  | "nao_elegivel"
  | "indisponivel"
  | "falha_sem_execucao"
  | "resultado_incerto"
  | "ja_executada";

export type ResultadoFerramentaProtegida = {
  dados: Record<string, unknown> | null;
  status: StatusResultadoFerramentaProtegida;
};

export type ContextoSeguroFerramenta = {
  conversaId: string;
  execucaoId: string;
  identificadorSessaoHash: string;
  usuarioIdEsperado: string | null;
};

export type SessaoSeguraFerramenta = {
  expiraEm: Date;
  referenciaHash: string;
  usuarioId: string;
};

export interface ResolvedorSessaoFerramenta {
  resolver(contexto: ContextoSeguroFerramenta): Promise<SessaoSeguraFerramenta | null>;
}

export type FerramentaProtegida = {
  dadosMinimosPermitidos: readonly string[];
  definicao: DefinicaoFerramentaOpenAi;
  finalidade: string;
  habilitada: boolean;
  handler?: (dados: {
    argumentos: Record<string, unknown>;
    contexto: ContextoSeguroFerramenta;
    sessao: SessaoSeguraFerramenta;
  }) => Promise<ResultadoFerramentaProtegida>;
  id: string;
  nivel: NivelProtecaoFerramenta;
  politicaConfirmacao: "nao_aplicavel" | "obrigatoria";
  politicaIdempotencia: "por_consulta" | "obrigatoria" | "bloqueada";
  schemaArgumentos: z.ZodType;
  schemaResultado: z.ZodType;
  versao: string;
};
