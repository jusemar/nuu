import {
  responderEventoWebhookWhatsapp,
  responderVerificacaoWebhookWhatsapp,
} from "@/features/comunicacao/whatsapp/lib/webhook/responder-webhook-whatsapp";

// `nodejs` é obrigatório: a validação de assinatura usa `node:crypto`.
export const runtime = "nodejs";

// A assinatura cobre o corpo exato de cada requisição, então nenhuma resposta
// pode ser reaproveitada de cache.
export const dynamic = "force-dynamic";

/** Handshake de verificação da Meta (`hub.mode`, `hub.verify_token`, `hub.challenge`). */
export async function GET(request: Request) {
  return responderVerificacaoWebhookWhatsapp(request);
}

/** Recebimento dos eventos assinados com `X-Hub-Signature-256`. */
export async function POST(request: Request) {
  return responderEventoWebhookWhatsapp(request);
}
