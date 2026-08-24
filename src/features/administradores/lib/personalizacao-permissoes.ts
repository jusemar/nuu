import type { PermissaoAdministrativaChave } from "@/features/autenticacao/constants/permissoes-administrativas";

export type OverridePlanejado = {
  efeito: "permitir" | "negar";
  permissao: PermissaoAdministrativaChave;
};

/** Persiste somente diferenças entre o preset escolhido e o estado desejado. */
export function planejarOverridesAdministrativos({
  permissoesCatalogo,
  permissoesDesejadas,
  permissoesFuncao,
}: {
  permissoesCatalogo: readonly PermissaoAdministrativaChave[];
  permissoesDesejadas: ReadonlySet<PermissaoAdministrativaChave>;
  permissoesFuncao: ReadonlySet<PermissaoAdministrativaChave>;
}): OverridePlanejado[] {
  return permissoesCatalogo.flatMap((permissao) => {
    const desejada = permissoesDesejadas.has(permissao);
    const herdada = permissoesFuncao.has(permissao);
    if (desejada === herdada) return [];
    return [{ efeito: desejada ? "permitir" : "negar", permissao }];
  });
}

export function validarDelegacaoPermissoes({
  atorPrincipal,
  permissoesAtor,
  permissoesDesejadas,
}: {
  atorPrincipal: boolean;
  permissoesAtor: ReadonlySet<PermissaoAdministrativaChave>;
  permissoesDesejadas: ReadonlySet<PermissaoAdministrativaChave>;
}) {
  if (atorPrincipal) return;
  for (const permissao of permissoesDesejadas) {
    if (!permissoesAtor.has(permissao)) {
      throw new Error("DELEGACAO_SUPERIOR_BLOQUEADA");
    }
  }
}

export function resolverVersaoAutorizacao({
  alterado,
  versaoAtual,
}: {
  alterado: boolean;
  versaoAtual: number;
}) {
  return alterado ? versaoAtual + 1 : versaoAtual;
}
