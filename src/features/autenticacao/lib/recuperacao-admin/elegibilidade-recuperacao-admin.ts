export type CandidatoRecuperacaoAdmin = {
  usuario: { id: string; phoneNumberVerified: boolean } | null;
  administrador: { status: "ativo" | "desativado" } | null;
  contaCredencial: { id: string; password: string | null } | null;
  /** Um telefone canônico de outro usuário nunca pode ser promovido pelo legado. */
  conflitoTelefone?: boolean;
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
  conflitoTelefone = false,
}: CandidatoRecuperacaoAdmin) {
  return Boolean(
    usuario &&
      administrador?.status === "ativo" &&
      contaCredencial?.password &&
      !conflitoTelefone,
  );
}
