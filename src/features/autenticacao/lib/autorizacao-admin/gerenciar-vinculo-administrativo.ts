import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  administradoresTable,
  auditoriasAdministrativasTable,
} from "@/db/tables/autorizacao-admin";
import { dbTransacional } from "@/db/transaction";

import {
  ErroPoliticaAdministrador,
  type OperacaoVinculoAdministrativo,
  validarOperacaoVinculoAdministrativo,
} from "./politica-gestor-principal";

/**
 * Mutation de domínio reutilizável pelas futuras actions de gestão. Todas as
 * linhas administrativas são travadas para impedir corrida entre rebaixamentos.
 */
export async function alterarVinculoAdministrativoProtegido({
  atorAdministradorId,
  alvoAdministradorId,
  operacao,
}: {
  atorAdministradorId: string;
  alvoAdministradorId: string;
  operacao: OperacaoVinculoAdministrativo;
}) {
  try {
    return await dbTransacional.transaction(async (transacao) => {
      const administradores = await transacao
        .select({
          administradorPrincipal: administradoresTable.administradorPrincipal,
          id: administradoresTable.id,
          status: administradoresTable.status,
          versaoAutorizacao: administradoresTable.versaoAutorizacao,
        })
        .from(administradoresTable)
        .orderBy(administradoresTable.id)
        .for("update");
      const ator = administradores.find(({ id }) => id === atorAdministradorId);
      const alvo = administradores.find(({ id }) => id === alvoAdministradorId);
      if (!ator || !alvo) throw new Error("ADMINISTRADOR_NAO_ENCONTRADO");

      validarOperacaoVinculoAdministrativo({
        ator,
        operacao,
        principaisAtivos: administradores
          .filter(
            (item) => item.status === "ativo" && item.administradorPrincipal,
          )
          .map(({ id }) => id),
        alvo,
      });

      const nenhumaMudanca =
        (operacao === "promover_principal" && alvo.administradorPrincipal) ||
        (operacao === "rebaixar_principal" && !alvo.administradorPrincipal) ||
        (operacao === "desativar" && alvo.status === "desativado");
      if (nenhumaMudanca) {
        return {
          alterado: false,
          versaoAutorizacao: alvo.versaoAutorizacao,
        };
      }

      const novaVersao = alvo.versaoAutorizacao + 1;
      if (operacao === "remover") {
        await transacao.insert(auditoriasAdministrativasTable).values({
          acao: "administrador_removido",
          atorAdministradorId,
          alvoAdministradorId,
          metadados: { versaoAnterior: alvo.versaoAutorizacao },
          recursoId: alvoAdministradorId,
          recursoTipo: "administrador",
          resultado: "sucesso",
        });
        await transacao
          .delete(administradoresTable)
          .where(eq(administradoresTable.id, alvoAdministradorId));
        return { alterado: true, removido: true };
      }

      const agora = new Date();
      const valores =
        operacao === "promover_principal"
          ? { administradorPrincipal: true }
          : operacao === "rebaixar_principal"
            ? { administradorPrincipal: false }
            : {
                administradorPrincipal: false,
                desativadoEm: agora,
                status: "desativado" as const,
              };
      await transacao
        .update(administradoresTable)
        .set({
          ...valores,
          updatedAt: agora,
          versaoAutorizacao: novaVersao,
        })
        .where(eq(administradoresTable.id, alvoAdministradorId));
      await transacao.insert(auditoriasAdministrativasTable).values({
        acao: `administrador_${operacao}`,
        atorAdministradorId,
        alvoAdministradorId,
        metadados: {
          versaoAnterior: alvo.versaoAutorizacao,
          versaoAutorizacao: novaVersao,
        },
        recursoId: alvoAdministradorId,
        recursoTipo: "administrador",
        resultado: "sucesso",
      });
      return { alterado: true, versaoAutorizacao: novaVersao };
    });
  } catch (erro) {
    if (erro instanceof ErroPoliticaAdministrador) {
      await db.insert(auditoriasAdministrativasTable).values({
        acao: `administrador_${operacao}_bloqueado`,
        atorAdministradorId,
        alvoAdministradorId,
        metadados: { motivo: erro.codigo },
        recursoId: alvoAdministradorId,
        recursoTipo: "administrador",
        resultado: "negado",
      });
    }
    throw erro;
  }
}
