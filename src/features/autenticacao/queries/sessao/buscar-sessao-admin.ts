import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import { emailPossuiPermissaoAdmin } from "../../lib/permissoes-admin";

export type ResultadoSessaoAdmin = {
  sessao: Awaited<ReturnType<typeof auth.api.getSession>>;
  autorizado: boolean;
  motivo: "ok" | "sem_sessao" | "sem_permissao" | "indisponivel";
};

export async function buscarSessaoAdmin(): Promise<ResultadoSessaoAdmin> {
  let sessao: Awaited<ReturnType<typeof auth.api.getSession>> = null;

  try {
    sessao = await auth.api.getSession({ headers: await headers() });
  } catch (erro) {
    const causa =
      erro instanceof Error && erro.cause instanceof Error ? erro.cause : null;
    const codigo =
      causa && "code" in causa && typeof causa.code === "string"
        ? causa.code
        : undefined;

    console.error("[autenticacao:sessao-admin:indisponivel]", {
      mensagem: causa?.message ?? "Falha ao consultar sessão administrativa.",
      codigo,
    });

    return { sessao: null, autorizado: false, motivo: "indisponivel" };
  }

  if (!sessao?.user) {
    return { sessao: null, autorizado: false, motivo: "sem_sessao" };
  }

  const autorizado = emailPossuiPermissaoAdmin(sessao.user.email);

  return {
    sessao,
    autorizado,
    motivo: autorizado ? "ok" : "sem_permissao",
  };
}
