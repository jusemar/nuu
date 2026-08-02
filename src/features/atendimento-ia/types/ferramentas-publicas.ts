import type { z } from "zod";

import type { NOMES_FERRAMENTAS_PUBLICAS } from "../constants/ferramentas-publicas";

export type NomeFerramentaPublica = (typeof NOMES_FERRAMENTAS_PUBLICAS)[number];

export type DefinicaoFerramentaOpenAi = {
  description: string;
  name: string;
  parameters: Record<string, unknown>;
  strict: true;
  type: "function";
};

export type ResultadoFerramentaPublica = {
  consultado_em: string;
  dados: Record<string, unknown> | null;
  fonte: string;
  status:
    | "encontrado"
    | "nenhum_resultado"
    | "dado_indisponivel"
    | "argumento_invalido"
    | "ferramenta_nao_autorizada"
    | "falha_recuperavel"
    | "falha_definitiva";
};

export type FerramentaPublica = {
  definicao: DefinicaoFerramentaOpenAi;
  executar: (argumentos: unknown) => Promise<ResultadoFerramentaPublica>;
  schemaArgumentos: z.ZodType;
  schemaResultado: z.ZodType;
  versao: string;
};

export type SolicitacaoFerramentaModelo = {
  argumentosJson: string;
  chamadaId: string;
  nome: string;
};

export interface ExecutorFerramentasPublicas {
  executar(dados: {
    argumentosJson: string;
    chamadaId: string;
    execucaoId: string;
    nome: string;
    contextoSeguro?: import("./ferramentas-protegidas").ContextoSeguroFerramenta;
  }): Promise<ResultadoFerramentaPublica | import("./ferramentas-protegidas").ResultadoFerramentaProtegida>;
}

export interface RepositorioExecucoesFerramentas {
  reivindicar(dados: {
    argumentos: Record<string, unknown>;
    chamadaId: string;
    chaveIdempotencia: string;
    execucaoId: string;
    classificacao?: "consulta_publica" | "consulta_protegida";
    nome: string;
    versao: string;
  }): Promise<
    | { tipo: "adquirida"; execucaoFerramentaId: string }
    | { tipo: "concluida"; resultado: ResultadoFerramentaPublica | import("./ferramentas-protegidas").ResultadoFerramentaProtegida }
    | { tipo: "em_processamento" }
  >;
  concluir(dados: {
    duracaoEmMs: number;
    execucaoFerramentaId: string;
    resultado: ResultadoFerramentaPublica | import("./ferramentas-protegidas").ResultadoFerramentaProtegida;
  }): Promise<void>;
  falhar(dados: {
    classificacao: "recuperavel" | "definitiva";
    execucaoFerramentaId: string;
    tipo: "ferramenta_indisponivel" | "erro_interno";
  }): Promise<void>;
}
