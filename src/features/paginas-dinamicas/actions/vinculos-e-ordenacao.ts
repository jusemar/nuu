"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  grupoPaginasTable,
  gruposNavegacaoTable,
  paginasDinamicasTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import {
  ehViolacaoUnicidade,
  exigirAdministradorPaginasDinamicas,
} from "../lib/backend-paginas-dinamicas";
import { paginaPodeSerAssociada } from "../lib/filtrar-paginas-associaveis";
import {
  associarPaginaGrupoSchema,
  editarVinculoPaginaGrupoSchema,
  removerPaginaGrupoSchema,
  reordenarGruposSchema,
  reordenarPaginasGrupoSchema,
} from "../schemas/paginas-dinamicas.schema";
import type { ResultadoOperacaoPaginasDinamicas } from "../types/paginas-dinamicas.types";

export async function associarPaginaAoGrupo(
  entrada: unknown,
): Promise<ResultadoOperacaoPaginasDinamicas<{ id: string }>> {
  try {
    await exigirAdministradorPaginasDinamicas();
    const dados = associarPaginaGrupoSchema.parse(entrada);
    const resultado = await dbTransacional.transaction(async (tx) => {
      const [grupo, pagina] = await Promise.all([
        tx
          .select({ id: gruposNavegacaoTable.id })
          .from(gruposNavegacaoTable)
          .where(eq(gruposNavegacaoTable.id, dados.grupoId))
          .limit(1),
        tx
          .select({
            id: paginasDinamicasTable.id,
            status: paginasDinamicasTable.status,
          })
          .from(paginasDinamicasTable)
          .where(eq(paginasDinamicasTable.id, dados.paginaId))
          .for("update")
          .limit(1),
      ]);
      if (!grupo.length || !pagina.length)
        return { tipo: "nao_encontrado" as const };
      if (!pagina[0] || !paginaPodeSerAssociada(pagina[0].status))
        return { tipo: "arquivada" as const };
      const [vinculo] = await tx
        .insert(grupoPaginasTable)
        .values(dados)
        .returning({ id: grupoPaginasTable.id });
      return vinculo ? { tipo: "criado" as const, vinculo } : null;
    });
    if (resultado?.tipo === "criado") {
      revalidatePath("/admin/configuracoes/paginas-da-loja");
      revalidatePath("/", "layout");
      return { sucesso: true, dados: resultado.vinculo };
    }
    return {
      sucesso: false,
      mensagem:
        resultado?.tipo === "arquivada"
          ? "Páginas arquivadas não podem ser associadas."
          : "Grupo ou página não encontrado.",
    };
  } catch (erro) {
    if (erro instanceof Error && erro.message === "NAO_AUTORIZADO")
      return {
        sucesso: false,
        mensagem: "Acesso administrativo não autorizado.",
      };
    if (ehViolacaoUnicidade(erro))
      return { sucesso: false, mensagem: "Esta página já pertence ao grupo." };
    return { sucesso: false, mensagem: "Não foi possível associar a página." };
  }
}

export async function editarVinculoPaginaGrupo(
  entrada: unknown,
): Promise<ResultadoOperacaoPaginasDinamicas> {
  try {
    await exigirAdministradorPaginasDinamicas();
    const dados = editarVinculoPaginaGrupoSchema.parse(entrada);
    const [vinculo] = await dbTransacional
      .update(grupoPaginasTable)
      .set({
        textoLink: dados.textoLink,
        ativo: dados.ativo,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(grupoPaginasTable.grupoId, dados.grupoId),
          eq(grupoPaginasTable.paginaId, dados.paginaId),
        ),
      )
      .returning({ id: grupoPaginasTable.id });
    if (vinculo) {
      revalidatePath("/admin/configuracoes/paginas-da-loja");
      revalidatePath("/", "layout");
    }
    return vinculo
      ? { sucesso: true, dados: undefined }
      : { sucesso: false, mensagem: "Associação não encontrada." };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem:
        erro instanceof Error && erro.message === "NAO_AUTORIZADO"
          ? "Acesso administrativo não autorizado."
          : "Não foi possível editar a associação.",
    };
  }
}

export async function removerPaginaDoGrupo(
  entrada: unknown,
): Promise<ResultadoOperacaoPaginasDinamicas> {
  try {
    await exigirAdministradorPaginasDinamicas();
    const dados = removerPaginaGrupoSchema.parse(entrada);
    const [removido] = await dbTransacional
      .delete(grupoPaginasTable)
      .where(
        and(
          eq(grupoPaginasTable.grupoId, dados.grupoId),
          eq(grupoPaginasTable.paginaId, dados.paginaId),
        ),
      )
      .returning({ id: grupoPaginasTable.id });
    if (removido) {
      revalidatePath("/admin/configuracoes/paginas-da-loja");
      revalidatePath("/", "layout");
    }
    return removido
      ? { sucesso: true, dados: undefined }
      : { sucesso: false, mensagem: "Associação não encontrada." };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem:
        erro instanceof Error && erro.message === "NAO_AUTORIZADO"
          ? "Acesso administrativo não autorizado."
          : "Não foi possível remover a associação.",
    };
  }
}

export async function reordenarGruposNavegacao(
  entrada: unknown,
): Promise<ResultadoOperacaoPaginasDinamicas> {
  try {
    await exigirAdministradorPaginasDinamicas();
    const dados = reordenarGruposSchema.parse(entrada);
    const concluido = await dbTransacional.transaction(async (tx) => {
      const atuais = await tx
        .select({ id: gruposNavegacaoTable.id })
        .from(gruposNavegacaoTable)
        .where(eq(gruposNavegacaoTable.localExibicao, dados.localExibicao))
        .orderBy(asc(gruposNavegacaoTable.ordem));
      if (
        atuais.length !== dados.idsOrdenados.length ||
        atuais.some(({ id }) => !dados.idsOrdenados.includes(id))
      )
        return false;
      const agora = new Date();
      await Promise.all(
        dados.idsOrdenados.map((id, ordem) =>
          tx
            .update(gruposNavegacaoTable)
            .set({ ordem, updatedAt: agora })
            .where(eq(gruposNavegacaoTable.id, id)),
        ),
      );
      return true;
    });
    if (concluido) {
      revalidatePath("/admin/configuracoes/paginas-da-loja");
      revalidatePath("/", "layout");
    }
    return concluido
      ? { sucesso: true, dados: undefined }
      : {
          sucesso: false,
          mensagem: "A ordenação deve conter todos os grupos do local.",
        };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem:
        erro instanceof Error && erro.message === "NAO_AUTORIZADO"
          ? "Acesso administrativo não autorizado."
          : "Não foi possível reordenar os grupos.",
    };
  }
}

export async function reordenarPaginasDoGrupo(
  entrada: unknown,
): Promise<ResultadoOperacaoPaginasDinamicas> {
  try {
    await exigirAdministradorPaginasDinamicas();
    const dados = reordenarPaginasGrupoSchema.parse(entrada);
    const concluido = await dbTransacional.transaction(async (tx) => {
      const atuais = await tx
        .select({ paginaId: grupoPaginasTable.paginaId })
        .from(grupoPaginasTable)
        .where(eq(grupoPaginasTable.grupoId, dados.grupoId))
        .orderBy(asc(grupoPaginasTable.ordem));
      if (
        atuais.length !== dados.idsPaginasOrdenadas.length ||
        atuais.some(
          ({ paginaId }) => !dados.idsPaginasOrdenadas.includes(paginaId),
        )
      )
        return false;
      const agora = new Date();
      await Promise.all(
        dados.idsPaginasOrdenadas.map((paginaId, ordem) =>
          tx
            .update(grupoPaginasTable)
            .set({ ordem, updatedAt: agora })
            .where(
              and(
                eq(grupoPaginasTable.grupoId, dados.grupoId),
                eq(grupoPaginasTable.paginaId, paginaId),
              ),
            ),
        ),
      );
      return true;
    });
    if (concluido) {
      revalidatePath("/admin/configuracoes/paginas-da-loja");
      revalidatePath("/", "layout");
    }
    return concluido
      ? { sucesso: true, dados: undefined }
      : {
          sucesso: false,
          mensagem: "A ordenação deve conter todas as páginas do grupo.",
        };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem:
        erro instanceof Error && erro.message === "NAO_AUTORIZADO"
          ? "Acesso administrativo não autorizado."
          : "Não foi possível reordenar as páginas.",
    };
  }
}
