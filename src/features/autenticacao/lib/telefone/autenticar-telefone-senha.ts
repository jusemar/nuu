export type UsuarioLoginTelefone = {
  id: string;
  phoneNumberVerified: boolean;
  senhaHash: string | null;
};

export async function autenticarTelefoneSenha(entrada: {
  usuario: UsuarioLoginTelefone | null;
  senha: string;
  verificarSenha: (senha: string, hash: string) => Promise<boolean>;
  executarCustoNeutro: (senha: string) => Promise<void>;
}) {
  if (!entrada.usuario?.phoneNumberVerified || !entrada.usuario.senhaHash) {
    await entrada.executarCustoNeutro(entrada.senha);
    return null;
  }

  const valida = await entrada.verificarSenha(
    entrada.senha,
    entrada.usuario.senhaHash,
  );
  return valida ? entrada.usuario.id : null;
}
