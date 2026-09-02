export type CandidatoRecuperacaoAdmin = {
  usuario: { id: string; phoneNumberVerified: boolean } | null;
  administrador: { status: "ativo" | "desativado" } | null;
  contaCredencial: { id: string; password: string | null } | null;
};

type CandidatoRecuperacaoAdminElegivel = {
  usuario: NonNullable<CandidatoRecuperacaoAdmin["usuario"]>;
  administrador: { status: "ativo" };
  contaCredencial: { id: string; password: string };
};

/** A emissão é autorizada somente quando toda a identidade administrativa existe. */
export function candidatoElegivelRecuperacaoAdmin(
  candidato: CandidatoRecuperacaoAdmin,
): candidato is CandidatoRecuperacaoAdminElegivel;
export function candidatoElegivelRecuperacaoAdmin({
  usuario,
  administrador,
  contaCredencial,
}: CandidatoRecuperacaoAdmin) {
  return Boolean(
    usuario && administrador?.status === "ativo" && contaCredencial?.password,
  );
}
