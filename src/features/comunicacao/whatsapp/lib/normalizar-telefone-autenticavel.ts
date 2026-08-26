import { telefoneAutenticavelSchema } from "../schemas/envio-otp-whatsapp.schema";
import { ErroComunicacaoWhatsapp } from "./erros-whatsapp";

/** Aceita somente o formato canônico definido para a identidade técnica da aplicação. */
export function normalizarTelefoneAutenticavel(numero: string): string {
  const resultado = telefoneAutenticavelSchema.safeParse(numero);

  if (!resultado.success) {
    throw new ErroComunicacaoWhatsapp(
      "ENTRADA_INVALIDA",
      "O telefone informado não está no formato E.164 autenticável.",
    );
  }

  return resultado.data;
}

/** A Graph API recebe os algarismos internacionais sem o prefixo `+`. */
export function adaptarTelefoneParaMeta(numeroCanonico: string): string {
  return normalizarTelefoneAutenticavel(numeroCanonico).slice(1);
}
