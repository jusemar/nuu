type UsuarioComEstadoTelefone = {
  phoneNumberVerified: boolean;
};

/**
 * Recuperação aceita identidades legadas com telefone ainda não verificado.
 * A confirmação do OTP é quem promoverá esse estado com segurança.
 */
export function usuarioElegivelRecuperacaoTelefone(
  usuario: UsuarioComEstadoTelefone | null | undefined,
) {
  return Boolean(usuario);
}
