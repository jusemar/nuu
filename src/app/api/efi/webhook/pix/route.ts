import { responderRequisicaoWebhookPixEfi } from "@/features/checkout/lib/gateways/efi/responder-webhook-pix-efi";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  return responderRequisicaoWebhookPixEfi(request);
}
