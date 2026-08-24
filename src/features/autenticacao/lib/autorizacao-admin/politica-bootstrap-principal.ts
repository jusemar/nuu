export type EstadoAdministradorBootstrap = {
  administradorPrincipal: boolean;
  id: string;
  status: "ativo" | "desativado";
  versaoAutorizacao: number;
};

export type DecisaoBootstrapPrincipal =
  | { tipo: "criar"; versaoFinal: 1 }
  | {
      administradorId: string;
      tipo: "promover";
      versaoFinal: number;
    }
  | {
      administradorId: string;
      tipo: "preservar";
      versaoFinal: number;
    }
  | { administradorId: string; tipo: "recusar_desativado" };

/** Planeja o bootstrap sem reativar ou rebaixar vínculos existentes. */
export function decidirBootstrapPrincipal(
  atual: EstadoAdministradorBootstrap | null,
): DecisaoBootstrapPrincipal {
  if (!atual) return { tipo: "criar", versaoFinal: 1 };
  if (atual.status === "desativado") {
    return { administradorId: atual.id, tipo: "recusar_desativado" };
  }
  if (atual.administradorPrincipal) {
    return {
      administradorId: atual.id,
      tipo: "preservar",
      versaoFinal: atual.versaoAutorizacao,
    };
  }
  return {
    administradorId: atual.id,
    tipo: "promover",
    versaoFinal: atual.versaoAutorizacao + 1,
  };
}
