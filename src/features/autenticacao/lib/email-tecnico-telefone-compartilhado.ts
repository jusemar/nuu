export const DOMINIO_EMAIL_TECNICO_TELEFONE = "telefone.nuu.invalid";

export function emailEhTecnicoTelefone(email: string) {
  return email.toLowerCase().endsWith(`@${DOMINIO_EMAIL_TECNICO_TELEFONE}`);
}
