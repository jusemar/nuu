import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

import { RepositorioEntradaAtendimentoDrizzle } from "@/features/atendimento-ia/actions/repositorio-entrada-atendimento-drizzle";
import { COOKIE_SESSAO_ATENDIMENTO_IA } from "@/features/atendimento-ia/constants/entrada-mensagem";
import { obterConfiguracaoAtendenteIa } from "@/features/atendimento-ia/lib/obter-configuracao-atendente";
import { processarRequisicaoEntradaMensagem } from "@/features/atendimento-ia/lib/processar-requisicao-entrada-mensagem";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

function obterIdentificadorSessao(requisicao: NextRequest) {
  const valor = requisicao.cookies.get(COOKIE_SESSAO_ATENDIMENTO_IA)?.value;

  // Cookies forjados ou legados não podem definir o isolamento da conversa.
  return valor &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      valor,
    )
    ? valor
    : randomUUID();
}

function obterOrigemPermitida() {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL;
  if (!url) throw new Error("ORIGEM_ATENDIMENTO_NAO_CONFIGURADA");
  return new URL(url).origin;
}

export async function POST(requisicao: NextRequest) {
  const identificadorSessao = obterIdentificadorSessao(requisicao);

  let usuarioId: string | null = null;
  try {
    const sessao = await auth.api.getSession({ headers: requisicao.headers });
    usuarioId = sessao?.user.id ?? null;
  } catch {
    // Uma falha ao ler a sessão nunca promove o visitante a usuário.
    usuarioId = null;
  }

  let resposta: Response;
  try {
    const configuracao = obterConfiguracaoAtendenteIa();
    resposta = await processarRequisicaoEntradaMensagem(requisicao, {
      atendenteAtivo: configuracao.ATENDENTE_IA_ATIVO,
      identidade: { identificadorSessao, usuarioId },
      origemPermitida: obterOrigemPermitida(),
      repositorio: new RepositorioEntradaAtendimentoDrizzle(),
    });
  } catch {
    resposta = Response.json(
      {
        erro: {
          codigo: "ATENDENTE_INDISPONIVEL",
          mensagem: "O atendimento está indisponível no momento.",
        },
        sucesso: false,
      },
      { status: 503 },
    );
  }

  const respostaNext = new NextResponse(resposta.body, resposta);
  if (
    requisicao.cookies.get(COOKIE_SESSAO_ATENDIMENTO_IA)?.value !==
    identificadorSessao
  ) {
    respostaNext.cookies.set(
      COOKIE_SESSAO_ATENDIMENTO_IA,
      identificadorSessao,
      {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    );
  }

  return respostaNext;
}
