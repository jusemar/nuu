import { NextResponse } from "next/server";

import { executarReconciliacaoLaquila } from "@/features/fornecedores/integracoes/laquila/actions/reconciliacao/executar-reconciliacao-laquila";
import { autorizarJobLaquila } from "@/features/fornecedores/integracoes/laquila/lib/reconciliacao/autorizar-job-laquila";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  if (
    !autorizarJobLaquila(
      request.headers.get("authorization"),
      process.env.CRON_SECRET,
    )
  ) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  try {
    return NextResponse.json(await executarReconciliacaoLaquila(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    console.error(
      "[laquila:reconciliacao] Falha operacional no job; nenhuma criação externa foi executada.",
    );
    return NextResponse.json(
      { erro: "Falha operacional na reconciliação." },
      { status: 500 },
    );
  }
}
