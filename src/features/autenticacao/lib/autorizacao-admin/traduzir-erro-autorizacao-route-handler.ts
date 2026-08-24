import "server-only";

import { NextResponse } from "next/server";

import { ErroAutorizacaoAdmin } from "./erros-autorizacao-admin";

/** Converte apenas erros conhecidos sem expor a estrutura interna do RBAC. */
export function traduzirErroAutorizacaoRouteHandler(erro: unknown) {
  if (!(erro instanceof ErroAutorizacaoAdmin)) return null;

  if (erro.codigo === "SESSAO_INDISPONIVEL") {
    return NextResponse.json(
      { error: "Não foi possível validar a sessão administrativa." },
      { status: 503 },
    );
  }

  const status = erro.codigo === "NAO_AUTENTICADO" ? 401 : 403;
  return NextResponse.json(
    {
      error:
        status === 401
          ? "Autenticação administrativa necessária."
          : "Acesso administrativo não autorizado.",
    },
    { status },
  );
}
