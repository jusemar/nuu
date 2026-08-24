import "server-only";

import { asc, eq, inArray, max } from "drizzle-orm";

import { db } from "@/db/connection";
import { sessionTable, userTable } from "@/db/schema";
import {
  administradoresFuncoesTable,
  administradoresPermissoesTable,
  administradoresTable,
  convitesAdministrativosTable,
  convitesFuncoesTable,
  funcoesAdministrativasTable,
  funcoesPermissoesTable,
  permissoesAdministrativasTable,
} from "@/db/tables/autorizacao-admin";
import {
  ehPermissaoAdministrativaChave,
  PERMISSOES_ADMIN,
} from "@/features/autenticacao/constants/permissoes-administrativas";
import { podeAdmin } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import type {
  AdministradorTela,
  DadosGestaoAdministradores,
} from "../types/gestao-administradores.types";

/** Lista apenas os campos necessários à gestão visual; sessões nunca saem da query. */
export async function listarAdministradores(): Promise<DadosGestaoAdministradores> {
  const contexto = await exigirPermissaoAdmin(
    PERMISSOES_ADMIN.ADMINISTRADORES.VISUALIZAR,
  );

  const [administradoresBase, permissoes, funcoes, convitesPendentes] =
    await Promise.all([
      db
        .select({
          administradorPrincipal: administradoresTable.administradorPrincipal,
          email: userTable.email,
          id: administradoresTable.id,
          nome: userTable.name,
          status: administradoresTable.status,
          ultimoAcesso: max(sessionTable.updatedAt),
          versaoAutorizacao: administradoresTable.versaoAutorizacao,
        })
        .from(administradoresTable)
        .innerJoin(userTable, eq(userTable.id, administradoresTable.usuarioId))
        .leftJoin(sessionTable, eq(sessionTable.userId, userTable.id))
        .groupBy(administradoresTable.id, userTable.id)
        .orderBy(asc(userTable.name)),
      db
        .select({
          chave: permissoesAdministrativasTable.chave,
          descricao: permissoesAdministrativasTable.descricao,
          id: permissoesAdministrativasTable.id,
          modulo: permissoesAdministrativasTable.modulo,
          nome: permissoesAdministrativasTable.nome,
        })
        .from(permissoesAdministrativasTable)
        .where(eq(permissoesAdministrativasTable.status, "ativa"))
        .orderBy(
          asc(permissoesAdministrativasTable.modulo),
          asc(permissoesAdministrativasTable.nome),
        ),
      db
        .select({
          chave: funcoesAdministrativasTable.chave,
          descricao: funcoesAdministrativasTable.descricao,
          id: funcoesAdministrativasTable.id,
          nome: funcoesAdministrativasTable.nome,
        })
        .from(funcoesAdministrativasTable)
        .where(eq(funcoesAdministrativasTable.status, "ativa"))
        .orderBy(asc(funcoesAdministrativasTable.nome)),
      db
        .select({
          email: convitesAdministrativosTable.emailDestinatario,
          expiraEm: convitesAdministrativosTable.expiraEm,
          funcao: funcoesAdministrativasTable.nome,
          id: convitesAdministrativosTable.id,
          nome: convitesAdministrativosTable.nomeDestinatario,
        })
        .from(convitesAdministrativosTable)
        .leftJoin(
          convitesFuncoesTable,
          eq(convitesFuncoesTable.conviteId, convitesAdministrativosTable.id),
        )
        .leftJoin(
          funcoesAdministrativasTable,
          eq(funcoesAdministrativasTable.id, convitesFuncoesTable.funcaoId),
        )
        .where(eq(convitesAdministrativosTable.status, "pendente"))
        .orderBy(asc(convitesAdministrativosTable.expiraEm)),
    ]);

  const administradoresIds = administradoresBase.map(({ id }) => id);
  const funcoesIds = funcoes.map(({ id }) => id);
  const [atribuicoes, overrides, permissoesFuncoes] = await Promise.all([
    administradoresIds.length
      ? db
          .select({
            administradorId: administradoresFuncoesTable.administradorId,
            funcaoId: funcoesAdministrativasTable.id,
            funcaoNome: funcoesAdministrativasTable.nome,
          })
          .from(administradoresFuncoesTable)
          .innerJoin(
            funcoesAdministrativasTable,
            eq(
              funcoesAdministrativasTable.id,
              administradoresFuncoesTable.funcaoId,
            ),
          )
          .where(
            inArray(
              administradoresFuncoesTable.administradorId,
              administradoresIds,
            ),
          )
      : [],
    administradoresIds.length
      ? db
          .select({
            administradorId: administradoresPermissoesTable.administradorId,
            efeito: administradoresPermissoesTable.efeito,
            permissao: permissoesAdministrativasTable.chave,
          })
          .from(administradoresPermissoesTable)
          .innerJoin(
            permissoesAdministrativasTable,
            eq(
              permissoesAdministrativasTable.id,
              administradoresPermissoesTable.permissaoId,
            ),
          )
          .where(
            inArray(
              administradoresPermissoesTable.administradorId,
              administradoresIds,
            ),
          )
      : [],
    funcoesIds.length
      ? db
          .select({
            funcaoId: funcoesPermissoesTable.funcaoId,
            permissao: permissoesAdministrativasTable.chave,
          })
          .from(funcoesPermissoesTable)
          .innerJoin(
            permissoesAdministrativasTable,
            eq(
              permissoesAdministrativasTable.id,
              funcoesPermissoesTable.permissaoId,
            ),
          )
          .where(inArray(funcoesPermissoesTable.funcaoId, funcoesIds))
      : [],
  ]);

  const permissoesValidas = permissoes.filter((permissao) =>
    ehPermissaoAdministrativaChave(permissao.chave),
  );
  const catalogo = permissoesValidas.map(({ chave }) => chave);
  const permissoesPorFuncao = new Map<string, string[]>();
  for (const item of permissoesFuncoes) {
    permissoesPorFuncao.set(item.funcaoId, [
      ...(permissoesPorFuncao.get(item.funcaoId) ?? []),
      item.permissao,
    ]);
  }

  const administradores: AdministradorTela[] = administradoresBase.map(
    (administrador) => {
      const funcoesDoAdministrador = atribuicoes.filter(
        ({ administradorId }) => administradorId === administrador.id,
      );
      const efetivas = new Set(
        administrador.administradorPrincipal
          ? catalogo
          : funcoesDoAdministrador.flatMap(
              ({ funcaoId }) => permissoesPorFuncao.get(funcaoId) ?? [],
            ),
      );
      const overridesDoAdministrador = overrides.filter(
        ({ administradorId }) => administradorId === administrador.id,
      );
      for (const override of overridesDoAdministrador) {
        if (override.efeito === "permitir") efetivas.add(override.permissao);
        else efetivas.delete(override.permissao);
      }

      return {
        ...administrador,
        funcaoId:
          funcoesDoAdministrador.length === 1
            ? funcoesDoAdministrador[0]!.funcaoId
            : null,
        funcoes: funcoesDoAdministrador.map(({ funcaoNome }) => funcaoNome),
        permissoesEfetivas: catalogo.filter((chave) => efetivas.has(chave)),
        personalizado:
          overridesDoAdministrador.length > 0 ||
          funcoesDoAdministrador.length !== 1,
        ultimoAcesso: administrador.ultimoAcesso?.toISOString() ?? null,
      } as AdministradorTela;
    },
  );

  return {
    administradores,
    atorPodeAdministrar: podeAdmin(
      contexto,
      PERMISSOES_ADMIN.ADMINISTRADORES.ADMINISTRAR,
    ),
    convitesPendentes: convitesPendentes.map((convite) => ({
      ...convite,
      expiraEm: convite.expiraEm.toISOString(),
      funcao: convite.funcao ?? "Personalizado",
    })),
    funcoes: funcoes.map((funcao) => ({
      ...funcao,
      permissoes: (permissoesPorFuncao.get(funcao.id) ?? []) as never[],
    })),
    permissoes: permissoesValidas
      .map((permissao) =>
        ehPermissaoAdministrativaChave(permissao.chave)
          ? {
              chave: permissao.chave,
              descricao: permissao.descricao,
              modulo: permissao.modulo,
              nome: permissao.nome,
            }
          : null,
      )
      .filter((permissao) => permissao !== null),
  };
}
