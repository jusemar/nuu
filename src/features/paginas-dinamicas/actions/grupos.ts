"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { gruposNavegacaoTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import {
  ehViolacaoUnicidade,
  exigirAdministradorPaginasDinamicas,
} from "../lib/backend-paginas-dinamicas";
import {
  alterarAtivacaoGrupoSchema,
  salvarGrupoNavegacaoSchema,
} from "../schemas/paginas-dinamicas.schema";
import type { ResultadoOperacaoPaginasDinamicas } from "../types/paginas-dinamicas.types";

export async function salvarGrupoNavegacao(
  entrada: unknown,
): Promise<ResultadoOperacaoPaginasDinamicas<{ id: string }>> {
  try {
    await exigirAdministradorPaginasDinamicas();
    const dados = salvarGrupoNavegacaoSchema.parse(entrada);
    const conflito = await dbTransacional
      .select({ id: gruposNavegacaoTable.id })
      .from(gruposNavegacaoTable)
      .where(
        dados.id
          ? and(
              eq(gruposNavegacaoTable.identificador, dados.identificador),
              ne(gruposNavegacaoTable.id, dados.id),
            )
          : eq(gruposNavegacaoTable.identificador, dados.identificador),
      )
      .limit(1);
    if (conflito.length)
      return {
        sucesso: false,
        mensagem: "Este identificador já está em uso.",
        campo: "identificador",
      };

    const valores = {
      nome: dados.nome,
      tituloPublico: dados.tituloPublico,
      identificador: dados.identificador,
      localExibicao: dados.localExibicao,
      ativo: dados.ativo,
      ordem: dados.ordem,
      updatedAt: new Date(),
    };
    if (dados.id) {
      const [grupo] = await dbTransacional
        .update(gruposNavegacaoTable)
        .set(valores)
        .where(eq(gruposNavegacaoTable.id, dados.id))
        .returning({ id: gruposNavegacaoTable.id });
      if (grupo) {
        revalidatePath("/admin/configuracoes/paginas-da-loja");
        revalidatePath("/", "layout");
      }
      return grupo
        ? { sucesso: true, dados: grupo }
        : { sucesso: false, mensagem: "Grupo não encontrado." };
    }
    const [grupo] = await dbTransacional
      .insert(gruposNavegacaoTable)
      .values(valores)
      .returning({ id: gruposNavegacaoTable.id });
    if (!grupo)
      return { sucesso: false, mensagem: "Não foi possível criar o grupo." };
    revalidatePath("/admin/configuracoes/paginas-da-loja");
    revalidatePath("/", "layout");
    return { sucesso: true, dados: grupo };
  } catch (erro) {
    if (erro instanceof Error && erro.message === "NAO_AUTORIZADO")
      return {
        sucesso: false,
        mensagem: "Acesso administrativo não autorizado.",
      };
    if (ehViolacaoUnicidade(erro))
      return {
        sucesso: false,
        mensagem: "Este identificador já está em uso.",
        campo: "identificador",
      };
    return { sucesso: false, mensagem: "Não foi possível salvar o grupo." };
  }
}

export async function alterarAtivacaoGrupoNavegacao(
  entrada: unknown,
): Promise<ResultadoOperacaoPaginasDinamicas> {
  try {
    await exigirAdministradorPaginasDinamicas();
    const dados = alterarAtivacaoGrupoSchema.parse(entrada);
    const [grupo] = await dbTransacional
      .update(gruposNavegacaoTable)
      .set({ ativo: dados.ativo, updatedAt: new Date() })
      .where(eq(gruposNavegacaoTable.id, dados.id))
      .returning({ id: gruposNavegacaoTable.id });
    if (grupo) {
      revalidatePath("/admin/configuracoes/paginas-da-loja");
      revalidatePath("/", "layout");
    }
    return grupo
      ? { sucesso: true, dados: undefined }
      : { sucesso: false, mensagem: "Grupo não encontrado." };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem:
        erro instanceof Error && erro.message === "NAO_AUTORIZADO"
          ? "Acesso administrativo não autorizado."
          : "Não foi possível alterar o grupo.",
    };
  }
}
