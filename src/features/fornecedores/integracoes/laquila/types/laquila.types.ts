import type { FornecedorIntegracaoApi } from "@/db/schema";

export type StatusTesteIntegracaoLaquila = "nao_testado" | "sucesso" | "erro";

export type ConfiguracaoLaquilaAdmin = Omit<
  FornecedorIntegracaoApi,
  "tokenClienteCriptografado"
> & {
  tokenConfigurado: boolean;
  tokenCliente: string | null;
  nomeFornecedor: string;
};

export type ResultadoSalvarConfiguracaoLaquila = {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  integracaoId?: string;
};

export type ResultadoTestarConexaoLaquila = {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  ultimoTesteStatus?: StatusTesteIntegracaoLaquila;
  ultimoTesteEm?: Date;
};

export type ConfiguracaoLaquilaSegura = {
  id: string;
  urlBase: string | null;
  cnpjEmpresa: string;
  tokenClienteCriptografado: string | null;
};
