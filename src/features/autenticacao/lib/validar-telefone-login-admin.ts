/** Telefone canônico só pode autenticar o admin depois da prova de posse. */
export function telefoneAdminVerificadoParaLogin(
  usuario: { phoneNumberVerified: boolean } | null | undefined,
) {
  return usuario?.phoneNumberVerified === true;
}
