"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { userTable } from "@/db/schema";
import {
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
  PERMISSOES_ADMIN,
} from "@/features/autenticacao/constants/permissoes-administrativas";
import { podeAdmin } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { montarUrlAbsoluta } from "@/lib/seo/url-site";

import { enviarEmailConviteAdministrativo } from "../lib/emails/enviar-email-convite-administrativo";
import {
  planejarOverridesAdministrativos,
  validarDelegacaoPermissoes,
} from "../lib/personalizacao-permissoes";
import {
  calcularExpiracaoConvite,
  gerarTokenConviteAdministrativo,
} from "../lib/token-convite-administrativo";
import { criarConviteAdministradorSchema } from "../schemas/convites-administrativos.schema";

export async function criarConviteAdministrador(entrada: unknown) {
  const contexto = await exigirPermissaoAdmin(
    PERMISSOES_ADMIN.ADMINISTRADORES.ADMINISTRAR,
  );
  const dados = criarConviteAdministradorSchema.parse(entrada);
  const { token, tokenHash } = gerarTokenConviteAdministrativo();
  const expiraEm = calcularExpiracaoConvite();

  const convite = await dbTransacional.transaction(async (tx) => {
    const [atorAtual] = await tx
      .select({
        id: administradoresTable.id,
        status: administradoresTable.status,
        versaoAutorizacao: administradoresTable.versaoAutorizacao,
      })
      .from(administradoresTable)
      .where(eq(administradoresTable.id, contexto.administradorId))
      .for("update");
    if (
      !atorAtual ||
      atorAtual.status !== "ativo" ||
      atorAtual.versaoAutorizacao !== contexto.versaoAutorizacao
    ) {
      throw new Error("EMISSOR_SEM_AUTORIDADE");
    }
    const [catalogo, funcao, usuario] = await Promise.all([
      tx
        .select({
          chave: permissoesAdministrativasTable.chave,
          id: permissoesAdministrativasTable.id,
        })
        .from(permissoesAdministrativasTable)
        .where(eq(permissoesAdministrativasTable.status, "ativa")),
      dados.funcaoId
        ? tx.query.funcoesAdministrativasTable.findFirst({
            columns: { id: true },
            where: and(
              eq(funcoesAdministrativasTable.id, dados.funcaoId),
              eq(funcoesAdministrativasTable.status, "ativa"),
            ),
          })
        : null,
      tx.query.userTable.findFirst({
        columns: { id: true },
        where: eq(userTable.email, dados.email),
      }),
    ]);
    if (dados.funcaoId && !funcao) throw new Error("FUNCAO_INVALIDA");
    if (usuario) {
      const administradorExistente =
        await tx.query.administradoresTable.findFirst({
          columns: { id: true },
          where: eq(administradoresTable.usuarioId, usuario.id),
        });
      if (administradorExistente)
        throw new Error("DESTINATARIO_JA_ADMINISTRADOR");
    }
    const catalogoValido = catalogo.filter(({ chave }) =>
      ehPermissaoAdministrativaChave(chave),
    );
    const desejadasEntrada = new Set(dados.permissoesEfetivas);
    if (
      desejadasEntrada.size !== dados.permissoesEfetivas.length ||
      [...desejadasEntrada].some(
        (chave) => !catalogoValido.some((item) => item.chave === chave),
      )
    )
      throw new Error("PERMISSAO_INVALIDA");
    const desejadas = new Set<PermissaoAdministrativaChave>();
    for (const chave of desejadasEntrada) {
      if (!ehPermissaoAdministrativaChave(chave))
        throw new Error("PERMISSAO_INVALIDA");
      desejadas.add(chave);
    }
    const permissoesAtor = new Set<PermissaoAdministrativaChave>();
    for (const { chave } of catalogoValido) {
      if (ehPermissaoAdministrativaChave(chave) && podeAdmin(contexto, chave))
        permissoesAtor.add(chave);
    }
    validarDelegacaoPermissoes({
      atorPrincipal: contexto.administradorPrincipal,
      permissoesAtor,
      permissoesDesejadas: desejadas,
    });
    const herdadas = new Set<PermissaoAdministrativaChave>();
    if (funcao) {
      const linhas = await tx
        .select({ chave: permissoesAdministrativasTable.chave })
        .from(funcoesPermissoesTable)
        .innerJoin(
          permissoesAdministrativasTable,
          eq(
            permissoesAdministrativasTable.id,
            funcoesPermissoesTable.permissaoId,
          ),
        )
        .where(eq(funcoesPermissoesTable.funcaoId, funcao.id));
      for (const { chave } of linhas)
        if (ehPermissaoAdministrativaChave(chave)) herdadas.add(chave);
    }
    const overrides = planejarOverridesAdministrativos({
      permissoesCatalogo: catalogoValido
        .map(({ chave }) => chave)
        .filter(ehPermissaoAdministrativaChave),
      permissoesDesejadas: desejadas,
      permissoesFuncao: herdadas,
    });
    await tx
      .update(convitesAdministrativosTable)
      .set({
        revogadoEm: new Date(),
        status: "revogado",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(convitesAdministrativosTable.emailDestinatario, dados.email),
          eq(convitesAdministrativosTable.status, "pendente"),
        ),
      );
    const [criado] = await tx
      .insert(convitesAdministrativosTable)
      .values({
        emailDestinatario: dados.email,
        emissorAdministradorId: contexto.administradorId,
        expiraEm,
        nomeDestinatario: dados.nome,
        tokenHash,
        usuarioDestinatarioId: usuario?.id ?? null,
      })
      .returning({ id: convitesAdministrativosTable.id });
    if (!criado) throw new Error("CONVITE_NAO_CRIADO");
    if (funcao)
      await tx
        .insert(convitesFuncoesTable)
        .values({ conviteId: criado.id, funcaoId: funcao.id });
    if (overrides.length)
      await tx.insert(convitesPermissoesTable).values(
        overrides.map(({ efeito, permissao }) => ({
          conviteId: criado.id,
          efeito,
          permissaoId: catalogoValido.find(({ chave }) => chave === permissao)!
            .id,
        })),
      );
    await tx.insert(auditoriasAdministrativasTable).values({
      acao: "convite_administrativo_criado",
      atorAdministradorId: contexto.administradorId,
      metadados: {
        possuiFuncao: Boolean(funcao),
        overrides: overrides.length,
      },
      recursoId: criado.id,
      recursoTipo: "convite_administrativo",
      resultado: "sucesso",
    });
    return criado;
  });

  try {
    await enviarEmailConviteAdministrativo({
      destinatario: dados.email,
      nome: dados.nome,
      url: montarUrlAbsoluta(
        `/convite-administrativo/${encodeURIComponent(token)}`,
      ),
    });
  } catch {
    await db
      .update(convitesAdministrativosTable)
      .set({
        revogadoEm: new Date(),
        status: "revogado",
        updatedAt: new Date(),
      })
      .where(eq(convitesAdministrativosTable.id, convite.id));
    throw new Error("Não foi possível enviar o convite.");
  }
  revalidatePath("/admin/configuracoes/usuarios-e-permissoes");
  return { sucesso: true as const };
}
