import {
  ehPermissaoAdministrativaChave,
  type PermissaoAdministrativaChave,
} from "../../constants/permissoes-administrativas";
import type {
  ContextoAdministrativo,
  ContextoAdministrativoAutorizado,
  DadosAutorizacaoAdministrador,
} from "../../types/autorizacao-admin.types";
import { ErroAutorizacaoAdmin } from "./erros-autorizacao-admin";

type EntradaContextoAdministrativo = {
  dados: DadosAutorizacaoAdministrador | null;
  userId: string | null;
};

/** Converte dados confiáveis do servidor em um contexto mínimo e fail-closed. */
export function resolverContextoAdministrativo({
  dados,
  userId,
}: EntradaContextoAdministrativo): ContextoAdministrativo {
  if (!userId) return { situacao: "nao_autenticado" };
  if (!dados) {
    return {
      origem: "identidade_sem_acesso",
      situacao: "sem_vinculo",
      userId,
    };
  }

  const { administrador } = dados;
  if (administrador.status !== "ativo") {
    return {
      administradorId: administrador.id,
      administradorPrincipal: false,
      origem: "rbac_persistido",
      situacao: "desativado",
      userId,
      versaoAutorizacao: administrador.versaoAutorizacao,
    };
  }

  const permissoesAtivasCatalogo = new Set<PermissaoAdministrativaChave>();
  for (const chave of dados.chavesAtivasCatalogo) {
    if (ehPermissaoAdministrativaChave(chave))
      permissoesAtivasCatalogo.add(chave);
  }

  const permissoesFuncoes = new Set<PermissaoAdministrativaChave>();
  for (const concessao of dados.concessoesFuncoes) {
    if (
      concessao.funcaoAtiva &&
      concessao.permissaoAtiva &&
      ehPermissaoAdministrativaChave(concessao.permissao) &&
      permissoesAtivasCatalogo.has(concessao.permissao)
    ) {
      permissoesFuncoes.add(concessao.permissao);
    }
  }

  const overrides = new Map<
    PermissaoAdministrativaChave,
    "permitir" | "negar"
  >();
  for (const override of dados.overrides) {
    if (
      override.permissaoAtiva &&
      ehPermissaoAdministrativaChave(override.permissao) &&
      permissoesAtivasCatalogo.has(override.permissao)
    ) {
      overrides.set(override.permissao, override.efeito);
    }
  }

  return {
    administradorId: administrador.id,
    administradorPrincipal: administrador.administradorPrincipal,
    origem: "rbac_persistido",
    permissoesAtivasCatalogo,
    permissoesFuncoes,
    overrides,
    situacao: "ativo",
    userId,
    versaoAutorizacao: administrador.versaoAutorizacao,
  };
}

/**
 * Ordem: permissão global ativa → principal → override → função → negar.
 * A checagem inicial impede até o principal de reativar chave desativada.
 */
export function podeAdmin(
  contexto: ContextoAdministrativo,
  permissao: PermissaoAdministrativaChave,
) {
  if (
    contexto.situacao !== "ativo" ||
    !ehPermissaoAdministrativaChave(permissao) ||
    !contexto.permissoesAtivasCatalogo.has(permissao)
  ) {
    return false;
  }
  if (contexto.administradorPrincipal) return true;
  const override = contexto.overrides.get(permissao);
  if (override) return override === "permitir";
  return contexto.permissoesFuncoes.has(permissao);
}

/** Política pura usada pelo guard server-only e por testes sem banco. */
export function exigirPermissaoNoContexto(
  contexto: ContextoAdministrativo,
  permissao: PermissaoAdministrativaChave,
): ContextoAdministrativoAutorizado {
  if (contexto.situacao === "nao_autenticado") {
    throw new ErroAutorizacaoAdmin("NAO_AUTENTICADO");
  }
  if (contexto.situacao === "sem_vinculo") {
    throw new ErroAutorizacaoAdmin("SEM_VINCULO_ADMINISTRATIVO");
  }
  if (contexto.situacao === "desativado") {
    throw new ErroAutorizacaoAdmin("ADMINISTRADOR_DESATIVADO");
  }
  if (!podeAdmin(contexto, permissao)) {
    throw new ErroAutorizacaoAdmin("SEM_PERMISSAO");
  }
  return contexto;
}
