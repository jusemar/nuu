import type { PermissaoAdministrativaChave } from "../constants/permissoes-administrativas";

export type ConcessaoFuncaoAdministrativa = {
  funcaoAtiva: boolean;
  permissaoAtiva: boolean;
  permissao: string;
};

export type OverridePermissaoAdministrativa = {
  efeito: "permitir" | "negar";
  permissaoAtiva: boolean;
  permissao: string;
};

export type DadosAutorizacaoAdministrador = {
  administrador: {
    administradorPrincipal: boolean;
    id: string;
    status: "ativo" | "desativado";
    versaoAutorizacao: number;
  };
  chavesAtivasCatalogo: string[];
  concessoesFuncoes: ConcessaoFuncaoAdministrativa[];
  overrides: OverridePermissaoAdministrativa[];
};

type ContextoComIdentidade = {
  userId: string;
};

export type ContextoAdministrativo =
  | { situacao: "nao_autenticado" }
  | (ContextoComIdentidade & {
      origem: "identidade_sem_acesso";
      situacao: "sem_vinculo";
    })
  | (ContextoComIdentidade & {
      administradorId: string;
      administradorPrincipal: false;
      origem: "rbac_persistido";
      situacao: "desativado";
      versaoAutorizacao: number;
    })
  | (ContextoComIdentidade & {
      administradorId: string;
      administradorPrincipal: boolean;
      origem: "rbac_persistido";
      permissoesAtivasCatalogo: ReadonlySet<PermissaoAdministrativaChave>;
      permissoesFuncoes: ReadonlySet<PermissaoAdministrativaChave>;
      overrides: ReadonlyMap<
        PermissaoAdministrativaChave,
        "permitir" | "negar"
      >;
      situacao: "ativo";
      versaoAutorizacao: number;
    });

export type ContextoAdministrativoAutorizado = Extract<
  ContextoAdministrativo,
  { situacao: "ativo" }
>;
