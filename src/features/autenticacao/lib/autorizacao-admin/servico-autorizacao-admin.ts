import "server-only";

import { db } from "@/db/connection";
import { auditoriasAdministrativasTable } from "@/db/schema";

import type { PermissaoAdministrativaChave } from "../../constants/permissoes-administrativas";
import { buscarDadosAutorizacaoAdminPorUsuarioId } from "../../queries/autorizacao-admin/buscar-dados-autorizacao-admin";
import { buscarSessaoAdmin } from "../../queries/sessao/buscar-sessao-admin";
import type { ContextoAdministrativo } from "../../types/autorizacao-admin.types";
import { ErroAutorizacaoAdmin } from "./erros-autorizacao-admin";
import {
  exigirPermissaoNoContexto,
  resolverContextoAdministrativo,
} from "./resolver-autorizacao-admin";

/** Resolve sempre a sessão e a versão atuais, sem cache de autorização. */
export async function obterContextoAdministrativo(): Promise<ContextoAdministrativo> {
  const resultadoSessao = await buscarSessaoAdmin();
  if (resultadoSessao.motivo === "indisponivel") {
    throw new ErroAutorizacaoAdmin("SESSAO_INDISPONIVEL");
  }

  const usuario = resultadoSessao.sessao?.user;
  const dados = usuario
    ? await buscarDadosAutorizacaoAdminPorUsuarioId(usuario.id)
    : null;

  return resolverContextoAdministrativo({
    dados,
    userId: usuario?.id ?? null,
  });
}

/** Guard final: nunca aceita contexto, papel ou permissão enviados pelo cliente. */
export async function exigirPermissaoAdmin(
  permissao: PermissaoAdministrativaChave,
) {
  const contexto = await obterContextoAdministrativo();
  try {
    return exigirPermissaoNoContexto(contexto, permissao);
  } catch (erro) {
    // Somente vínculos persistidos fornecem um ator confiável para auditoria.
    if (contexto.situacao === "ativo" || contexto.situacao === "desativado") {
      try {
        await db.insert(auditoriasAdministrativasTable).values({
          acao: "autorizacao.permissao_negada",
          atorAdministradorId: contexto.administradorId,
          metadados: { permissao },
          recursoTipo: permissao.split(".")[0] ?? "administracao",
          resultado: "negado",
        });
      } catch (erroAuditoria) {
        console.error("Falha ao registrar auditoria de autorização negada.", {
          tipo:
            erroAuditoria instanceof Error
              ? erroAuditoria.name
              : "Erro desconhecido",
        });
      }
    }
    throw erro;
  }
}
