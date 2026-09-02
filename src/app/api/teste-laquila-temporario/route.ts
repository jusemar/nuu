import { NextResponse } from "next/server";
import { z } from "zod";

import {
  executarTesteLaquilaTemporario,
  validarTokenTesteLaquilaTemporario,
} from "@/features/fornecedores/integracoes/laquila/lib/executar-teste-laquila-temporario";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const entradaSchema = z.object({
  pedidoId: z.string().uuid(),
});

export async function POST(request: Request) {
  if (!validarTokenTesteLaquilaTemporario(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const entrada = entradaSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!entrada.success) {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }

  try {
    const resultado = await executarTesteLaquilaTemporario(
      entrada.data.pedidoId,
    );
    return NextResponse.json(resultado);
  } catch (erro) {
    console.error("[laquila:teste-temporario]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido.",
    });
    return NextResponse.json(
      { erro: "O teste controlado não pôde ser concluído." },
      { status: 500 },
    );
  }
}
