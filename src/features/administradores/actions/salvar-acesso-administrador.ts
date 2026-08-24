"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import {
  administradoresFuncoesTable,
  administradoresPermissoesTable,
  administradoresTable,
  auditoriasAdministrativasTable,
  funcoesAdministrativasTable,
  funcoesPermissoesTable,
  permissoesAdministrativasTable,
} from "@/db/tables/autorizacao-admin";
import { dbTransacional } from "@/db/transaction";
import {
  ehPermissaoAdministrativaChave,
  type PermissaoAdministrativaChave,
  PERMISSOES_ADMIN,
} from "@/features/autenticacao/constants/permissoes-administrativas";
import { podeAdmin } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import {
  planejarOverridesAdministrativos,
  resolverVersaoAutorizacao,
  validarDelegacaoPermissoes,
} from "../lib/personalizacao-permissoes";
import { salvarAcessoAdministradorSchema } from "../schemas/gestao-administradores.schema";

function conjuntosIguais<T>(primeiro: ReadonlySet<T>, segundo: ReadonlySet<T>) {
  return (
    primeiro.size === segundo.size &&
    [...primeiro].every((item) => segundo.has(item))
  );
}

/** Mutation única da tela; toda decisão sensível é repetida dentro da transação. */
export async function salvarAcessoAdministrador(entrada: unknown) {
  const contexto = await exigirPermissaoAdmin(
    PERMISSOES_ADMIN.ADMINISTRADORES.ADMINISTRAR,
  );
  const dados = salvarAcessoAdministradorSchema.parse(entrada);

  try {
    const resultado = await dbTransacional.transaction(async (transacao) => {
      const administradores = await transacao
        .select()
        .from(administradoresTable)
        .orderBy(administradoresTable.id)
        .for("update");
      const ator = administradores.find(
        ({ id }) => id === contexto.administradorId,
      );
      const alvo = administradores.find(
        ({ id }) => id === dados.administradorId,
      );
      if (
        !ator ||
        !alvo ||
        ator.status !== "ativo" ||
        ator.versaoAutorizacao !== contexto.versaoAutorizacao
      ) {
        throw new Error("ADMINISTRADOR_NAO_ENCONTRADO");
      }

      const catalogo = await transacao
        .select({
          chave: permissoesAdministrativasTable.chave,
          id: permissoesAdministrativasTable.id,
        })
        .from(permissoesAdministrativasTable)
        .where(eq(permissoesAdministrativasTable.status, "ativa"));
      const catalogoPorChave = new Map(
        catalogo.map((permissao) => [permissao.chave, permissao]),
      );
      const permissoesDesejadas = new Set(dados.permissoesEfetivas);
      if (
        permissoesDesejadas.size !== dados.permissoesEfetivas.length ||
        [...permissoesDesejadas].some(
          (permissao) => !catalogoPorChave.has(permissao),
        )
      ) {
        throw new Error("PERMISSAO_INVALIDA");
      }

      validarDelegacaoPermissoes({
        atorPrincipal: ator.administradorPrincipal,
        permissoesAtor: new Set(
          catalogo
            .map(({ chave }) => chave)
            .filter(ehPermissaoAdministrativaChave)
            .filter((permissao) => podeAdmin(contexto, permissao)),
        ),
        permissoesDesejadas,
      });

      if (alvo.administradorPrincipal) {
        if (!ator.administradorPrincipal) {
          throw new Error("ALTERACAO_PRINCIPAL_BLOQUEADA");
        }
        const outrosPrincipaisAtivos = administradores.filter(
          (item) =>
            item.id !== alvo.id &&
            item.status === "ativo" &&
            item.administradorPrincipal,
        );
        if (
          dados.status === "desativado" &&
          alvo.status === "ativo" &&
          outrosPrincipaisAtivos.length === 0
        ) {
          throw new Error("ULTIMO_PRINCIPAL_ATIVO");
        }
        if (dados.funcaoId !== null) throw new Error("PRINCIPAL_SEM_PRESET");
      }

      const funcao = dados.funcaoId
        ? await transacao.query.funcoesAdministrativasTable.findFirst({
            columns: { id: true, status: true },
            where: and(
              eq(funcoesAdministrativasTable.id, dados.funcaoId),
              eq(funcoesAdministrativasTable.status, "ativa"),
            ),
          })
        : null;
      if (dados.funcaoId && !funcao) throw new Error("FUNCAO_INVALIDA");

      const permissoesDaFuncao = funcao
        ? await transacao
            .select({ chave: permissoesAdministrativasTable.chave })
            .from(funcoesPermissoesTable)
            .innerJoin(
              permissoesAdministrativasTable,
              eq(
                permissoesAdministrativasTable.id,
                funcoesPermissoesTable.permissaoId,
              ),
            )
            .where(eq(funcoesPermissoesTable.funcaoId, funcao.id))
        : [];
      const herdadas = new Set(
        permissoesDaFuncao.map(({ chave }) => chave),
      ) as Set<PermissaoAdministrativaChave>;
      const overridesPlanejados = alvo.administradorPrincipal
        ? []
        : planejarOverridesAdministrativos({
            permissoesCatalogo: catalogo.map(
              ({ chave }) => chave,
            ) as PermissaoAdministrativaChave[],
            permissoesDesejadas,
            permissoesFuncao: herdadas,
          });

      const [funcoesAtuais, overridesAtuais] = await Promise.all([
        transacao
          .select({ funcaoId: administradoresFuncoesTable.funcaoId })
          .from(administradoresFuncoesTable)
          .where(eq(administradoresFuncoesTable.administradorId, alvo.id)),
        transacao
          .select({
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
          .where(eq(administradoresPermissoesTable.administradorId, alvo.id)),
      ]);
      const funcoesDesejadas = new Set(funcao ? [funcao.id] : []);
      const overridesDesejados = new Set(
        overridesPlanejados.map(
          ({ efeito, permissao }) => `${permissao}:${efeito}`,
        ),
      );
      const nenhumaMudanca =
        alvo.status === dados.status &&
        conjuntosIguais(
          new Set(funcoesAtuais.map(({ funcaoId }) => funcaoId)),
          funcoesDesejadas,
        ) &&
        conjuntosIguais(
          new Set(
            overridesAtuais.map(
              ({ efeito, permissao }) => `${permissao}:${efeito}`,
            ),
          ),
          overridesDesejados,
        );
      if (nenhumaMudanca) {
        return {
          alterado: false,
          versaoAutorizacao: alvo.versaoAutorizacao,
        };
      }

      await transacao
        .delete(administradoresFuncoesTable)
        .where(eq(administradoresFuncoesTable.administradorId, alvo.id));
      await transacao
        .delete(administradoresPermissoesTable)
        .where(eq(administradoresPermissoesTable.administradorId, alvo.id));
      if (funcao) {
        await transacao.insert(administradoresFuncoesTable).values({
          administradorId: alvo.id,
          funcaoId: funcao.id,
        });
      }
      if (overridesPlanejados.length) {
        await transacao.insert(administradoresPermissoesTable).values(
          overridesPlanejados.map(({ efeito, permissao }) => ({
            administradorId: alvo.id,
            efeito,
            permissaoId: catalogoPorChave.get(permissao)!.id,
          })),
        );
      }

      const novaVersao = resolverVersaoAutorizacao({
        alterado: true,
        versaoAtual: alvo.versaoAutorizacao,
      });
      await transacao
        .update(administradoresTable)
        .set({
          ativadoEm:
            dados.status === "ativo" && alvo.status !== "ativo"
              ? new Date()
              : alvo.ativadoEm,
          desativadoEm: dados.status === "desativado" ? new Date() : null,
          status: dados.status,
          updatedAt: new Date(),
          versaoAutorizacao: novaVersao,
        })
        .where(eq(administradoresTable.id, alvo.id));
      await transacao.insert(auditoriasAdministrativasTable).values({
        acao: "administrador_acesso_atualizado",
        atorAdministradorId: ator.id,
        alvoAdministradorId: alvo.id,
        metadados: {
          overrides: overridesPlanejados.length,
          statusAlterado: alvo.status !== dados.status,
          versaoAnterior: alvo.versaoAutorizacao,
          versaoAutorizacao: novaVersao,
        },
        recursoId: alvo.id,
        recursoTipo: "administrador",
        resultado: "sucesso",
      });
      return { alterado: true, versaoAutorizacao: novaVersao };
    });

    revalidatePath("/admin/configuracoes/usuarios-e-permissoes");
    return { ...resultado, sucesso: true as const };
  } catch (erro) {
    if (
      erro instanceof Error &&
      [
        "DELEGACAO_SUPERIOR_BLOQUEADA",
        "ALTERACAO_PRINCIPAL_BLOQUEADA",
        "ULTIMO_PRINCIPAL_ATIVO",
        "PRINCIPAL_SEM_PRESET",
      ].includes(erro.message)
    ) {
      await db.insert(auditoriasAdministrativasTable).values({
        acao: "administrador_acesso_bloqueado",
        atorAdministradorId: contexto.administradorId,
        alvoAdministradorId: dados.administradorId,
        metadados: { motivo: erro.message },
        recursoId: dados.administradorId,
        recursoTipo: "administrador",
        resultado: "negado",
      });
      return {
        mensagem: "A alteração solicitada não é permitida.",
        sucesso: false as const,
      };
    }
    throw erro;
  }
}
