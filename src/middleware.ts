import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { montarUrlLoginAdmin } from "@/features/autenticacao/lib/normalizar-redirecionamento-admin";

export function middleware(request: NextRequest) {
  const caminho = request.nextUrl.pathname;
  const cabecalhos = new Headers(request.headers);
  cabecalhos.set("x-caminho-admin", caminho);

  if (caminho !== "/admin/login" && !getSessionCookie(request)) {
    return NextResponse.redirect(
      new URL(montarUrlLoginAdmin(caminho, "sessao_expirada"), request.url),
    );
  }

  return NextResponse.next({ request: { headers: cabecalhos } });
}

export const config = { matcher: ["/admin/:path*"] };
