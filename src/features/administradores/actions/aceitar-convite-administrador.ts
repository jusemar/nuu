"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { userTable } from "@/db/schema";
import {
  administradoresFuncoesTable,
  administradoresPermissoesTable,
  administradoresTable,
  auditoriasAdministrativasTable,
  convitesAdministrativosTable,
  convitesFuncoesTable,
  convitesPermissoesTable,
  funcoesAdministrativasTable,
  funcoesPermissoesTable,
  permissoesAdministrativasTable,
} from "@/db/tables/autorizacao-admin";
import { dbTransacional } from "@/db/transaction";
import {
  ehPermissaoAdministrativaChave,
  type PermissaoAdministrativaChave,
} from "@/features/autenticacao/constants/permissoes-administrativas";
import { auth } from "@/lib/auth";

import {
  calcularHashTokenConvite,
  compararHashTokenConvite,
} from "../lib/token-convite-administrativo";
import { tokenConviteSchema } from "../schemas/convites-administrativos.schema";

export async function aceitarConviteAdministrador(tokenEntrada: unknown) {
  const token = tokenConviteSchema.parse(tokenEntrada);
  const sessao = await auth.api.getSession({
    headers: new Headers(await headers()),
  });
  if (!sessao?.user)
    return {
      mensagem: "Autentique-se para continuar.",
      sucesso: false as const,
    };
  const tokenHash = calcularHashTokenConvite(token);

  try {
    await dbTransacional.transaction(async (tx) => {
      const [convite] = await tx
        .select()
        .from(convitesAdministrativosTable)
        .where(eq(convitesAdministrativosTable.tokenHash, tokenHash))
        .for("update");
      if (
        !convite ||
        !compararHashTokenConvite(token, convite.tokenHash) ||
        convite.status !== "pendente"
      )
        throw new Error("CONVITE_INVALIDO");
      if (convite.expiraEm <= new Date()) {
        throw new Error("CONVITE_EXPIRADO");
      }
      if (
        sessao.user.email.toLowerCase() !==
        convite.emailDestinatario.toLowerCase()
      )
        throw new Error("IDENTIDADE_DIVERGENTE");
      const existente = await tx.query.administradoresTable.findFirst({
        columns: { id: true },
        where: eq(administradoresTable.usuarioId, sessao.user.id),
      });
      if (existente) throw new Error("ADMINISTRADOR_EXISTENTE");
      const emissor = await tx.query.administradoresTable.findFirst({
        where: and(
          eq(administradoresTable.id, convite.emissorAdministradorId),
          eq(administradoresTable.status, "ativo"),
        ),
      });
      if (!emissor) throw new Error("EMISSOR_SEM_AUTORIDADE");
      const catalogo = await tx
        .select({ chave: permissoesAdministrativasTable.chave })
        .from(permissoesAdministrativasTable)
        .where(eq(permissoesAdministrativasTable.status, "ativa"));
      const chavesAtivas = new Set(
        catalogo
          .map(({ chave }) => chave)
          .filter(ehPermissaoAdministrativaChave),
      );
      const funcoesConvite = await tx
        .select({
          funcaoId: convitesFuncoesTable.funcaoId,
          status: funcoesAdministrativasTable.status,
        })
        .from(convitesFuncoesTable)
        .innerJoin(
          funcoesAdministrativasTable,
          eq(funcoesAdministrativasTable.id, convitesFuncoesTable.funcaoId),
        )
        .where(eq(convitesFuncoesTable.conviteId, convite.id));
      if (funcoesConvite.some(({ status }) => status !== "ativa"))
        throw new Error("FUNCAO_INATIVA");
      const idsFuncoes = funcoesConvite.map(({ funcaoId }) => funcaoId);
      const herdadasConvite = new Set<PermissaoAdministrativaChave>();
      for (const funcaoId of idsFuncoes) {
        const linhas = await tx
          .select({
            chave: permissoesAdministrativasTable.chave,
            status: permissoesAdministrativasTable.status,
          })
          .from(funcoesPermissoesTable)
          .innerJoin(
            permissoesAdministrativasTable,
            eq(
              permissoesAdministrativasTable.id,
              funcoesPermissoesTable.permissaoId,
            ),
          )
          .where(eq(funcoesPermissoesTable.funcaoId, funcaoId));
        for (const linha of linhas) {
          if (
            linha.status !== "ativa" ||
            !ehPermissaoAdministrativaChave(linha.chave)
          )
            throw new Error("PERMISSAO_INATIVA");
          herdadasConvite.add(linha.chave);
        }
      }
      const overridesConvite = await tx
        .select({
          efeito: convitesPermissoesTable.efeito,
          permissaoId: convitesPermissoesTable.permissaoId,
          chave: permissoesAdministrativasTable.chave,
          status: permissoesAdministrativasTable.status,
        })
        .from(convitesPermissoesTable)
        .innerJoin(
          permissoesAdministrativasTable,
          eq(
            permissoesAdministrativasTable.id,
            convitesPermissoesTable.permissaoId,
          ),
        )
        .where(eq(convitesPermissoesTable.conviteId, convite.id));
      const desejadas = new Set(herdadasConvite);
      for (const override of overridesConvite) {
        if (
          override.status !== "ativa" ||
          !ehPermissaoAdministrativaChave(override.chave)
        )
          throw new Error("PERMISSAO_INATIVA");
        if (override.efeito === "permitir") desejadas.add(override.chave);
        else desejadas.delete(override.chave);
      }
      const delegaveis = new Set<PermissaoAdministrativaChave>();
      if (emissor.administradorPrincipal)
        for (const chave of chavesAtivas) delegaveis.add(chave);
      else {
        const funcoesEmissor = await tx
          .select({ chave: permissoesAdministrativasTable.chave })
          .from(administradoresFuncoesTable)
          .innerJoin(
            funcoesPermissoesTable,
            eq(
              funcoesPermissoesTable.funcaoId,
              administradoresFuncoesTable.funcaoId,
            ),
          )
          .innerJoin(
            permissoesAdministrativasTable,
            eq(
              permissoesAdministrativasTable.id,
              funcoesPermissoesTable.permissaoId,
            ),
          )
          .where(
            and(
              eq(administradoresFuncoesTable.administradorId, emissor.id),
              eq(permissoesAdministrativasTable.status, "ativa"),
            ),
          );
        for (const { chave } of funcoesEmissor)
          if (ehPermissaoAdministrativaChave(chave)) delegaveis.add(chave);
        const overridesEmissor = await tx
          .select({
            chave: permissoesAdministrativasTable.chave,
            efeito: administradoresPermissoesTable.efeito,
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
            and(
              eq(administradoresPermissoesTable.administradorId, emissor.id),
              eq(permissoesAdministrativasTable.status, "ativa"),
            ),
          );
        for (const item of overridesEmissor) {
          if (!ehPermissaoAdministrativaChave(item.chave)) continue;
          if (item.efeito === "permitir") delegaveis.add(item.chave);
          else delegaveis.delete(item.chave);
        }
      }
      if ([...desejadas].some((chave) => !delegaveis.has(chave)))
        throw new Error("EMISSOR_SEM_AUTORIDADE");
      if (!delegaveis.has("administradores.administrar"))
        throw new Error("EMISSOR_SEM_AUTORIDADE");

      const [administrador] = await tx
        .insert(administradoresTable)
        .values({
          administradorPrincipal: false,
          ativadoEm: new Date(),
          status: "ativo",
          usuarioId: sessao.user.id,
          versaoAutorizacao: 1,
        })
        .returning({ id: administradoresTable.id });
      if (!administrador) throw new Error("ATIVACAO_FALHOU");
      if (idsFuncoes.length)
        await tx.insert(administradoresFuncoesTable).values(
          idsFuncoes.map((funcaoId) => ({
            administradorId: administrador.id,
            funcaoId,
          })),
        );
      if (overridesConvite.length)
        await tx.insert(administradoresPermissoesTable).values(
          overridesConvite.map(({ efeito, permissaoId }) => ({
            administradorId: administrador.id,
            efeito,
            permissaoId,
          })),
        );
      await tx
        .update(userTable)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(userTable.id, sessao.user.id));
      await tx
        .update(convitesAdministrativosTable)
        .set({
          aceitoEm: new Date(),
          status: "aceito",
          updatedAt: new Date(),
          usuarioDestinatarioId: sessao.user.id,
        })
        .where(eq(convitesAdministrativosTable.id, convite.id));
      await tx.insert(auditoriasAdministrativasTable).values([
        {
          acao: "convite_administrativo_aceito",
          atorAdministradorId: emissor.id,
          alvoAdministradorId: administrador.id,
          recursoId: convite.id,
          recursoTipo: "convite_administrativo",
          resultado: "sucesso",
        },
        {
          acao: "administrador_ativado_por_convite",
          atorAdministradorId: emissor.id,
          alvoAdministradorId: administrador.id,
          metadados: { versaoAutorizacao: 1 },
          recursoId: administrador.id,
          recursoTipo: "administrador",
          resultado: "sucesso",
        },
      ]);
    });
    return { sucesso: true as const };
  } catch (erro) {
    if (erro instanceof Error && erro.message === "CONVITE_EXPIRADO") {
      const [expirado] = await dbTransacional
        .update(convitesAdministrativosTable)
        .set({ status: "expirado", updatedAt: new Date() })
        .where(
          and(
            eq(convitesAdministrativosTable.tokenHash, tokenHash),
            eq(convitesAdministrativosTable.status, "pendente"),
          ),
        )
        .returning({
          emissorAdministradorId:
            convitesAdministrativosTable.emissorAdministradorId,
          id: convitesAdministrativosTable.id,
        });
      if (expirado) {
        await dbTransacional.insert(auditoriasAdministrativasTable).values({
          acao: "convite_administrativo_expirado",
          atorAdministradorId: expirado.emissorAdministradorId,
          recursoId: expirado.id,
          recursoTipo: "convite_administrativo",
          resultado: "negado",
        });
      }
    } else {
      const conviteBloqueado =
        await dbTransacional.query.convitesAdministrativosTable.findFirst({
          columns: { emissorAdministradorId: true, id: true },
          where: eq(convitesAdministrativosTable.tokenHash, tokenHash),
        });
      if (conviteBloqueado) {
        await dbTransacional.insert(auditoriasAdministrativasTable).values({
          acao: "convite_administrativo_consumo_bloqueado",
          atorAdministradorId: conviteBloqueado.emissorAdministradorId,
          metadados: {
            motivo: erro instanceof Error ? erro.message : "CONVITE_INVALIDO",
          },
          recursoId: conviteBloqueado.id,
          recursoTipo: "convite_administrativo",
          resultado: "negado",
        });
      }
    }
    return {
      mensagem: "Este convite não pode ser utilizado.",
      sucesso: false as const,
    };
  }
}
