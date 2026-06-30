import { NextResponse } from "next/server";

import {
  listarProdutosRecebidosApiLaquila,
  TIMEOUT_ATUALIZACAO_MANUAL_RECEBIDOS_LAQUILA_MS,
} from "@/features/fornecedores/integracoes/laquila/queries";

export async function POST() {
  const resultado = await listarProdutosRecebidosApiLaquila({
    ignorarCache: true,
    timeoutGeralMs: TIMEOUT_ATUALIZACAO_MANUAL_RECEBIDOS_LAQUILA_MS,
  });

  return NextResponse.json(resultado);
}
