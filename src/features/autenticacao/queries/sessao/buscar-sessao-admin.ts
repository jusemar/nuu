import "server-only";

import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import {
  classificarSessaoAdmin,
  consultarSessaoComRepeticao,
  diagnosticarErroSessaoAdmin,
} from "../../lib/diagnosticar-erro-sessao-admin";
import { buscarVinculoAdministrativoBasico } from "../autorizacao-admin/buscar-vinculo-administrativo-basico";

export type ResultadoSessaoAdmin = {
  sessao: Awaited<ReturnType<typeof auth.api.getSession>>;
  autorizado: boolean;
  origemAutorizacao: "rbac_persistido" | null;
  motivo:
    | "ok"
    | "sessao_ausente"
    | "sessao_expirada"
    | "sem_permissao"
    | "indisponivel";
};

export async function buscarSessaoAdmin(): Promise<ResultadoSessaoAdmin> {
  let sessao: Awaited<ReturnType<typeof auth.api.getSession>> = null;
  // ReadonlyHeaders do Next expõe uma propriedade `headers` interna que
  // confunde o detector do Better Auth. A cópia nativa preserva os cookies.
  const cabecalhos = new Headers(await headers());
  const cookieSessaoPresente = Boolean(getSessionCookie(cabecalhos));

  if (!cookieSessaoPresente) {
    return {
      sessao: null,
      autorizado: false,
      motivo: "sessao_ausente",
      origemAutorizacao: null,
    };
  }

  try {
    sessao = await consultarSessaoComRepeticao({
      consultar: () => auth.api.getSession({ headers: cabecalhos }),
      aoFalhar: ({ diagnostico, tentativa, repetira }) => {
        console.warn("[autenticacao:sessao-admin:tentativa-falhou]", {
          tipo: diagnostico.tipo,
          codigo: diagnostico.codigo,
          status: diagnostico.status,
          tentativa,
          repetira,
          cookieSessaoPresente,
        });
      },
    });
  } catch (erro) {
    const diagnostico = diagnosticarErroSessaoAdmin(erro);

    console.error("[autenticacao:sessao-admin:indisponivel]", {
      tipo: diagnostico.tipo,
      mensagem: diagnostico.mensagem,
      codigo: diagnostico.codigo,
      status: diagnostico.status,
      cookieSessaoPresente,
    });

    return {
      sessao: null,
      autorizado: false,
      motivo: "indisponivel",
      origemAutorizacao: null,
    };
  }

  const vinculo = sessao?.user
    ? await buscarVinculoAdministrativoBasico(sessao.user.id)
    : null;
  const autorizado = vinculo?.status === "ativo";
  const motivo = classificarSessaoAdmin({
    cookieSessaoPresente,
    usuarioPresente: Boolean(sessao?.user),
    autorizado,
  });

  return {
    sessao,
    autorizado,
    motivo,
    origemAutorizacao: autorizado ? "rbac_persistido" : null,
  };
}
