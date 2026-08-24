import type { PermissaoAdministrativaChave } from "@/features/autenticacao/constants/permissoes-administrativas";

export type PermissaoAdministrativaTela = {
  chave: PermissaoAdministrativaChave;
  descricao: string | null;
  modulo: string;
  nome: string;
};

export type FuncaoAdministrativaTela = {
  chave: string;
  descricao: string | null;
  id: string;
  nome: string;
  permissoes: PermissaoAdministrativaChave[];
};

export type AdministradorTela = {
  administradorPrincipal: boolean;
  email: string;
  funcaoId: string | null;
  funcoes: string[];
  id: string;
  nome: string;
  permissoesEfetivas: PermissaoAdministrativaChave[];
  personalizado: boolean;
  status: "ativo" | "desativado";
  ultimoAcesso: string | null;
  versaoAutorizacao: number;
};

export type DadosGestaoAdministradores = {
  administradores: AdministradorTela[];
  atorPodeAdministrar: boolean;
  convitesPendentes: Array<{
    email: string;
    expiraEm: string;
    funcao: string;
    id: string;
    nome: string;
  }>;
  funcoes: FuncaoAdministrativaTela[];
  permissoes: PermissaoAdministrativaTela[];
};
