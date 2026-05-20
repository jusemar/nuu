import { NextResponse } from "next/server";

import {
  processarWebhookPixEfi,
  validarTokenWebhookPixEfi,
} from "./webhook-efi";

export async function responderRequisicaoWebhookPixEfi(request: Request) {
  const url = new URL(request.url);
  const tokenRecebido =
    request.headers.get("x-efi-webhook-token") || url.searchParams.get("token");

  if (!validarTokenWebhookPixEfi({ tokenRecebido })) {
    return NextResponse.json(
      { error: "Webhook PIX Efí não autorizado." },
      { status: 401 },
    );
  }

  try {
    const payload = await request.json().catch(() => null);

    if (!payload?.pix) {
      console.info("Webhook PIX Efí validado sem payload de pagamento.");
      return NextResponse.json({ received: true });
    }

    const resultados = await processarWebhookPixEfi(payload);

    console.info("Webhook PIX Efí processado.", resultados);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook PIX Efí.", {
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });

    return NextResponse.json(
      { error: "Webhook PIX Efí inválido." },
      { status: 400 },
    );
  }
}
