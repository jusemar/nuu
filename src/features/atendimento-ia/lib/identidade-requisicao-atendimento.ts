import "server-only";

import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

import { COOKIE_SESSAO_ATENDIMENTO_IA } from "../constants/entrada-mensagem";

export async function resolverIdentidadeRequisicao(requisicao: NextRequest) {
  const cookie = requisicao.cookies.get(COOKIE_SESSAO_ATENDIMENTO_IA)?.value;
  const identificadorSessao = cookie && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cookie)
    ? cookie : randomUUID();
  let usuarioId: string | null = null;
  try {
    const sessao = await auth.api.getSession({ headers: requisicao.headers });
    usuarioId = sessao?.user.id ?? null;
  } catch {
    usuarioId = null;
  }
  return { identificadorSessao, usuarioId };
}

export function aplicarCookieSessaoAtendimento(
  resposta: Response,
  requisicao: NextRequest,
  identificadorSessao: string,
) {
  const respostaNext = new NextResponse(resposta.body, resposta);
  if (requisicao.cookies.get(COOKIE_SESSAO_ATENDIMENTO_IA)?.value !== identificadorSessao) {
    respostaNext.cookies.set(COOKIE_SESSAO_ATENDIMENTO_IA, identificadorSessao, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return respostaNext;
}
