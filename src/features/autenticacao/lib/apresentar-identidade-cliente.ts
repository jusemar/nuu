import { emailEhTecnicoTelefone } from "./email-tecnico-telefone-compartilhado";
import { mascararTelefoneCliente } from "./normalizar-identificador-cliente";

export function apresentarEmailCliente(email: string) {
  return emailEhTecnicoTelefone(email) ? null : email;
}

export function formatarTelefoneAutenticacaoCliente(numero: string | null) {
  if (!numero) return null;
  const digitos = numero.replace(/\D/g, "").replace(/^55/, "");
  if (digitos.length !== 11) return mascararTelefoneCliente(numero);
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function identificarMetodosAcesso(provedores: Iterable<string>) {
  const conjunto = new Set(provedores);
  return {
    possuiSenha: conjunto.has("credential"),
    possuiGoogle: conjunto.has("google"),
  };
}
