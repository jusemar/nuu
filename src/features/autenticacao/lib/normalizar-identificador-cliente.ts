import { z } from "zod";

export type IdentificadorClienteNormalizado =
  | { tipo: "email"; valor: string }
  | { tipo: "telefone"; valor: string };

export function normalizarTelefoneBrasileiroAmigavel(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  const nacional = digitos.startsWith("55") ? digitos.slice(2) : digitos;
  if (!/^[1-9][0-9]9[0-9]{8}$/.test(nacional)) return null;
  return `+55${nacional}`;
}

export function normalizarIdentificadorCliente(
  valor: string,
): IdentificadorClienteNormalizado | null {
  const email = valor.trim().toLowerCase();
  if (z.email().safeParse(email).success)
    return { tipo: "email", valor: email };
  const telefone = normalizarTelefoneBrasileiroAmigavel(valor);
  return telefone ? { tipo: "telefone", valor: telefone } : null;
}

export function mascararTelefoneCliente(numero: string) {
  return `••••••${numero.slice(-4)}`;
}
