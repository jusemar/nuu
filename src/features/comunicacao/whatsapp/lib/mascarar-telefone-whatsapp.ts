import { normalizarTelefoneAutenticavel } from "./normalizar-telefone-autenticavel";

export function mascararTelefoneWhatsapp(numero: string): string {
  const numeroCanonico = normalizarTelefoneAutenticavel(numero);
  return `${numeroCanonico.slice(0, 5)}*****${numeroCanonico.slice(-4)}`;
}
