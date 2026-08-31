import "server-only";

import { verificacaoWebhookWhatsappSchema } from "../../schemas/webhook-whatsapp.schema";
import type { ResultadoVerificacaoWebhookWhatsapp } from "../../types/webhook-whatsapp.types";
import { compararEmTempoConstante } from "./validar-assinatura-webhook-whatsapp";

/**
 * Resolve o handshake que a Meta dispara ao salvar a URL do webhook.
 *
 * A plataforma chama a rota com `hub.mode=subscribe`, o token que você
 * cadastrou no painel e um desafio aleatório. A inscrição só é aceita se a
 * resposta devolver esse desafio, provando que quem controla a URL também
 * conhece o token combinado.
 */
export function verificarInscricaoWebhookWhatsapp({
  parametros,
  tokenVerificacao,
}: {
  parametros: URLSearchParams;
  tokenVerificacao: string;
}): ResultadoVerificacaoWebhookWhatsapp {
  const resultado = verificacaoWebhookWhatsappSchema.safeParse({
    "hub.mode": parametros.get("hub.mode"),
    "hub.verify_token": parametros.get("hub.verify_token"),
    "hub.challenge": parametros.get("hub.challenge"),
  });

  if (!resultado.success) {
    return { autorizado: false, motivo: "PARAMETROS_INVALIDOS" };
  }

  // O token também é comparado em tempo constante: ele é um segredo
  // compartilhado, exatamente como a assinatura.
  const tokenConfere = compararEmTempoConstante(
    resultado.data["hub.verify_token"],
    tokenVerificacao,
  );

  if (!tokenConfere) {
    return { autorizado: false, motivo: "TOKEN_INCORRETO" };
  }

  return { autorizado: true, desafio: resultado.data["hub.challenge"] };
}
