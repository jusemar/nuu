import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { reconciliarPagamentosPendentes } from "@/features/checkout/lib/pagamentos/reconciliar-pagamentos-pendentes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function segredoValido(request: Request) {
  const segredo = process.env.CRON_SECRET?.trim();
  const recebido = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!segredo || !recebido) return false;
  const esperadoBuffer = Buffer.from(segredo);
  const recebidoBuffer = Buffer.from(recebido);
  return (
    esperadoBuffer.length === recebidoBuffer.length &&
    timingSafeEqual(esperadoBuffer, recebidoBuffer)
  );
}

async function executar(request: Request) {
  if (!segredoValido(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  try {
    const resultado = await reconciliarPagamentosPendentes();
    return NextResponse.json(resultado);
  } catch (erro) {
    console.error("[checkout:reconciliar-pagamentos-pendentes]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido.",
    });
    return NextResponse.json(
      { erro: "Não foi possível reconciliar os pagamentos." },
      { status: 500 },
    );
  }
}

export const GET = executar;
export const POST = executar;
