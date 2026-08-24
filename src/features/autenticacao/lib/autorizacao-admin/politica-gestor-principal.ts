export type OperacaoVinculoAdministrativo =
  | "promover_principal"
  | "rebaixar_principal"
  | "desativar"
  | "remover";

export type AdministradorParaPolitica = {
  administradorPrincipal: boolean;
  id: string;
  status: "ativo" | "desativado";
};

export type CodigoErroPoliticaAdministrador =
  | "ATOR_SEM_AUTORIDADE"
  | "AUTOELEVACAO_BLOQUEADA"
  | "ULTIMO_PRINCIPAL_ATIVO";

export class ErroPoliticaAdministrador extends Error {
  constructor(readonly codigo: CodigoErroPoliticaAdministrador) {
    super("Alteração administrativa não autorizada.");
    this.name = "ErroPoliticaAdministrador";
  }
}

/**
 * Política pura aplicada dentro da transação que mantém os principais
 * bloqueados. A lista recebida deve representar o snapshot já travado no banco.
 */
export function validarOperacaoVinculoAdministrativo({
  ator,
  operacao,
  principaisAtivos,
  alvo,
}: {
  ator: AdministradorParaPolitica;
  operacao: OperacaoVinculoAdministrativo;
  principaisAtivos: readonly string[];
  alvo: AdministradorParaPolitica;
}) {
  if (
    operacao === "promover_principal" &&
    ator.id === alvo.id &&
    !alvo.administradorPrincipal
  ) {
    throw new ErroPoliticaAdministrador("AUTOELEVACAO_BLOQUEADA");
  }
  if (ator.status !== "ativo" || !ator.administradorPrincipal) {
    throw new ErroPoliticaAdministrador("ATOR_SEM_AUTORIDADE");
  }

  const removeCondicaoDePrincipal =
    alvo.status === "ativo" &&
    alvo.administradorPrincipal &&
    ["rebaixar_principal", "desativar", "remover"].includes(operacao);
  if (
    removeCondicaoDePrincipal &&
    principaisAtivos.filter((id) => id !== alvo.id).length === 0
  ) {
    throw new ErroPoliticaAdministrador("ULTIMO_PRINCIPAL_ATIVO");
  }
}
