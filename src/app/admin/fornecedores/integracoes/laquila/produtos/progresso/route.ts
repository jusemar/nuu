import { NextResponse } from "next/server";

import { obterProgressoRecebidosApiLaquila } from "@/features/fornecedores/integracoes/laquila/queries";

export async function GET() {
  return NextResponse.json(obterProgressoRecebidosApiLaquila());
}
