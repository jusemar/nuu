type UsuarioComTelefone = {
  id: string;
  phoneNumberVerified: boolean;
};

/**
 * Um telefone livre ou já pertencente ao próprio usuário pode ser comprovado
 * por OTP. Somente a propriedade por outra identidade impede a emissão.
 */
export function telefoneDisponivelParaVinculo({
  usuarioId,
  proprietario,
}: {
  usuarioId: string;
  proprietario: UsuarioComTelefone | null | undefined;
}) {
  return !proprietario || proprietario.id === usuarioId;
}
