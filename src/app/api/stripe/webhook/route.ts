import { NextResponse } from "next/server";

import {
  construirEventoWebhookStripe,
  processarWebhookStripe,
} from "@/features/checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Assinatura Stripe ausente." },
      { status: 400 },
    );
  }

  const body = await request.text();

  try {
    const event = construirEventoWebhookStripe({
      body,
      signature,
    });

    await processarWebhookStripe(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook Stripe.", {
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });

    return NextResponse.json(
      { error: "Webhook Stripe inválido." },
      { status: 400 },
    );
  }
}
