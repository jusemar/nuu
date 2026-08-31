import { createHmac, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSINATURA_PREFIXO = "sha256=";

function compararSegredos(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

function assinaturaValida(
  corpoBruto: string,
  assinaturaRecebida: string | null,
  appSecret: string,
): boolean {
  if (!assinaturaRecebida?.startsWith(ASSINATURA_PREFIXO)) {
    return false;
  }

  const assinaturaEsperada = `${ASSINATURA_PREFIXO}${createHmac("sha256", appSecret)
    .update(corpoBruto, "utf8")
    .digest("hex")}`;

  return compararSegredos(assinaturaRecebida, assinaturaEsperada);
}

function registrarEventoComSeguranca(payload: unknown): void {
  if (!payload || typeof payload !== "object") {
    console.info("[whatsapp-webhook] Evento recebido sem objeto JSON válido.");
    return;
  }

  const evento = payload as {
    object?: unknown;
    entry?: unknown[];
  };

  console.info("[whatsapp-webhook] Evento Meta recebido.", {
    object: typeof evento.object === "string" ? evento.object : undefined,
    entries: Array.isArray(evento.entry) ? evento.entry.length : 0,
  });
}

export async function GET(request: NextRequest) {
  const verifyToken = process.env.WHATSAPP_META_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error(
      "[whatsapp-webhook] WHATSAPP_META_VERIFY_TOKEN não está configurado.",
    );
    return new NextResponse("Webhook não configurado", { status: 500 });
  }

  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    challenge &&
    compararSegredos(token, verifyToken)
  ) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse("Verificação recusada", { status: 403 });
}

export async function POST(request: NextRequest) {
  const appSecret = process.env.WHATSAPP_META_APP_SECRET;

  if (!appSecret) {
    console.error(
      "[whatsapp-webhook] WHATSAPP_META_APP_SECRET não está configurado.",
    );
    return NextResponse.json(
      { recebido: false, erro: "Webhook não configurado" },
      { status: 500 },
    );
  }

  const corpoBruto = await request.text();
  const assinatura = request.headers.get("x-hub-signature-256");

  if (!assinaturaValida(corpoBruto, assinatura, appSecret)) {
    console.warn("[whatsapp-webhook] Assinatura inválida ou ausente.");
    return NextResponse.json(
      { recebido: false, erro: "Assinatura inválida" },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = JSON.parse(corpoBruto) as unknown;
  } catch {
    console.warn("[whatsapp-webhook] Corpo JSON inválido.");
    return NextResponse.json(
      { recebido: false, erro: "JSON inválido" },
      { status: 400 },
    );
  }

  // Nesta etapa o webhook somente valida, recebe e registra metadados mínimos.
  // A integração com o atendimento IA será feita separadamente.
  registrarEventoComSeguranca(payload);

  return NextResponse.json({ recebido: true }, { status: 200 });
}
