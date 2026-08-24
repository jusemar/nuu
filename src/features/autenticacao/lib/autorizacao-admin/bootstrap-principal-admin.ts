import "server-only";

import { eq, sql } from "drizzle-orm";

import { userTable } from "@/db/tables/autenticacao";
import {
  administradoresTable,
  auditoriasAdministrativasTable,
} from "@/db/tables/autorizacao-admin";
import { dbTransacional } from "@/db/transaction";

import { decidirBootstrapPrincipal } from "./politica-bootstrap-principal";

/**
 * Bootstrap explícito por identidade Better Auth já existente. O lock global
 * evita duas execuções concorrentes criarem/promoverem o mesmo proprietário.
 */
export async function executarBootstrapPrincipalPorUsuarioId(
  usuarioId: string,
) {
  return dbTransacional.transaction(async (transacao) => {
    await transacao.execute(
      sql`select pg_advisory_xact_lock(hashtext('nuu_rbac_bootstrap_principal_global'))`,
    );

    const usuario = await transacao.query.userTable.findFirst({
      columns: { id: true },
      where: eq(userTable.id, usuarioId),
    });
    if (!usuario) throw new Error("USUARIO_BETTER_AUTH_NAO_ENCONTRADO");

    const atual = await transacao.query.administradoresTable.findFirst({
      columns: {
        administradorPrincipal: true,
        id: true,
        status: true,
        versaoAutorizacao: true,
      },
      where: eq(administradoresTable.usuarioId, usuarioId),
    });
    const decisao = decidirBootstrapPrincipal(atual ?? null);

    if (decisao.tipo === "recusar_desativado") {
      throw new Error("VINCULO_ADMINISTRATIVO_DESATIVADO");
    }
    if (decisao.tipo === "preservar") {
      return {
        administradorId: decisao.administradorId,
        alterado: false,
        criado: false,
        versaoAutorizacao: decisao.versaoFinal,
      };
    }

    if (decisao.tipo === "criar") {
      const agora = new Date();
      const [administrador] = await transacao
        .insert(administradoresTable)
        .values({
          administradorPrincipal: true,
          ativadoEm: agora,
          status: "ativo",
          usuarioId,
          versaoAutorizacao: 1,
        })
        .returning({ id: administradoresTable.id });
      if (!administrador) throw new Error("FALHA_CRIAR_ADMINISTRADOR");

      await transacao.insert(auditoriasAdministrativasTable).values({
        acao: "bootstrap_principal_criado",
        alvoAdministradorId: administrador.id,
        metadados: { origem: "sistema", versaoAutorizacao: 1 },
        recursoId: administrador.id,
        recursoTipo: "administrador",
        resultado: "sucesso",
      });
      return {
        administradorId: administrador.id,
        alterado: true,
        criado: true,
        versaoAutorizacao: 1,
      };
    }

    const [promovido] = await transacao
      .update(administradoresTable)
      .set({
        administradorPrincipal: true,
        updatedAt: new Date(),
        versaoAutorizacao: decisao.versaoFinal,
      })
      .where(eq(administradoresTable.id, decisao.administradorId))
      .returning({ id: administradoresTable.id });
    if (!promovido) throw new Error("FALHA_PROMOVER_ADMINISTRADOR");

    await transacao.insert(auditoriasAdministrativasTable).values({
      acao: "administrador_principal_ativado",
      alvoAdministradorId: promovido.id,
      metadados: {
        origem: "bootstrap_controlado",
        versaoAutorizacao: decisao.versaoFinal,
      },
      recursoId: promovido.id,
      recursoTipo: "administrador",
      resultado: "sucesso",
    });
    return {
      administradorId: promovido.id,
      alterado: true,
      criado: false,
      versaoAutorizacao: decisao.versaoFinal,
    };
  });
}
