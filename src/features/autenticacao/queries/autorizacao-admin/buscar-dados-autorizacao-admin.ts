import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  administradoresFuncoesTable,
  administradoresPermissoesTable,
  administradoresTable,
  funcoesAdministrativasTable,
  funcoesPermissoesTable,
  permissoesAdministrativasTable,
} from "@/db/tables/autorizacao-admin";

import type { DadosAutorizacaoAdministrador } from "../../types/autorizacao-admin.types";

/**
 * Busca somente os dados persistidos necessários à decisão. A autorização
 * continua sendo responsabilidade do serviço, nunca desta query.
 */
export async function buscarDadosAutorizacaoAdminPorUsuarioId(
  usuarioId: string,
): Promise<DadosAutorizacaoAdministrador | null> {
  const administrador = await db.query.administradoresTable.findFirst({
    columns: {
      administradorPrincipal: true,
      id: true,
      status: true,
      versaoAutorizacao: true,
    },
    where: eq(administradoresTable.usuarioId, usuarioId),
  });
  if (!administrador) return null;

  // Consultas independentes são paralelas e evitam uma consulta por função.
  const [catalogo, concessoesFuncoes, overrides] = await Promise.all([
    db
      .select({ chave: permissoesAdministrativasTable.chave })
      .from(permissoesAdministrativasTable)
      .where(eq(permissoesAdministrativasTable.status, "ativa")),
    db
      .select({
        funcaoStatus: funcoesAdministrativasTable.status,
        permissao: permissoesAdministrativasTable.chave,
        permissaoStatus: permissoesAdministrativasTable.status,
      })
      .from(administradoresFuncoesTable)
      .innerJoin(
        funcoesAdministrativasTable,
        eq(
          administradoresFuncoesTable.funcaoId,
          funcoesAdministrativasTable.id,
        ),
      )
      .innerJoin(
        funcoesPermissoesTable,
        eq(funcoesPermissoesTable.funcaoId, funcoesAdministrativasTable.id),
      )
      .innerJoin(
        permissoesAdministrativasTable,
        eq(
          funcoesPermissoesTable.permissaoId,
          permissoesAdministrativasTable.id,
        ),
      )
      .where(
        and(
          eq(administradoresFuncoesTable.administradorId, administrador.id),
          eq(funcoesAdministrativasTable.status, "ativa"),
        ),
      ),
    db
      .select({
        efeito: administradoresPermissoesTable.efeito,
        permissao: permissoesAdministrativasTable.chave,
        permissaoStatus: permissoesAdministrativasTable.status,
      })
      .from(administradoresPermissoesTable)
      .innerJoin(
        permissoesAdministrativasTable,
        eq(
          administradoresPermissoesTable.permissaoId,
          permissoesAdministrativasTable.id,
        ),
      )
      .where(
        eq(administradoresPermissoesTable.administradorId, administrador.id),
      ),
  ]);

  return {
    administrador,
    chavesAtivasCatalogo: catalogo.map(({ chave }) => chave),
    concessoesFuncoes: concessoesFuncoes.map((item) => ({
      funcaoAtiva: item.funcaoStatus === "ativa",
      permissaoAtiva: item.permissaoStatus === "ativa",
      permissao: item.permissao,
    })),
    overrides: overrides.map((item) => ({
      efeito: item.efeito,
      permissaoAtiva: item.permissaoStatus === "ativa",
      permissao: item.permissao,
    })),
  };
}
