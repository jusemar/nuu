import "server-only";

import { NextResponse } from "next/server";

import {
  resolverDestinoProdutoJaaa,
  resolverMeuDestinoJaaa,
} from "./resolver-destinos-jaaa";
/** Endpoints de integração: a resolução atual impede usar um link anterior à revogação. */
export async function redirecionarProdutoJaaa(request: Request, id: string) {
  let destino: string | null = null;
  try {
    if (!new URL(request.url).search)
      destino = await resolverDestinoProdutoJaaa(id);
  } catch {}
  return resposta(destino ?? "/contato");
}
export async function redirecionarRepresentanteJaaa(request: Request) {
  try {
    if (new URL(request.url).search)
      throw new Error("Parâmetros indisponíveis.");
    const destino = await resolverMeuDestinoJaaa();
    return resposta(destino ?? "/admin/atendimento-jaaa");
  } catch {
    return NextResponse.json(
      { mensagem: "Acesso indisponível." },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  }
}
function resposta(destino: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: destino,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
