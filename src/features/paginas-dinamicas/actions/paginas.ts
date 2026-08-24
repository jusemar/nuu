"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { paginasDinamicasTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import {
  ehViolacaoUnicidade,
  exigirAdministradorPaginasDinamicas,
} from "../lib/backend-paginas-dinamicas";
import {
  arquivarPaginaSchema,
  salvarPaginaDinamicaSchema,
} from "../schemas/paginas-dinamicas.schema";
import type { ResultadoOperacaoPaginasDinamicas } from "../types/paginas-dinamicas.types";

export async function salvarPaginaDinamica(
  entrada: unknown,
): Promise<ResultadoOperacaoPaginasDinamicas<{ id: string }>> {
  try {
    await exigirAdministradorPaginasDinamicas();
    const dados = salvarPaginaDinamicaSchema.parse(entrada);
    const existente = await dbTransacional
      .select({ id: paginasDinamicasTable.id })
      .from(paginasDinamicasTable)
      .where(
        dados.id
          ? and(
              eq(paginasDinamicasTable.slug, dados.slug),
              ne(paginasDinamicasTable.id, dados.id),
            )
          : eq(paginasDinamicasTable.slug, dados.slug),
      )
      .limit(1);
    if (existente.length)
      return {
        sucesso: false,
        mensagem: "Este slug já está em uso.",
        campo: "slug",
      };

    const agora = new Date();
    const paginaAnterior = dados.id
      ? await dbTransacional
          .select({ slug: paginasDinamicasTable.slug })
          .from(paginasDinamicasTable)
          .where(eq(paginasDinamicasTable.id, dados.id))
          .limit(1)
      : [];
    const valores = {
      titulo: dados.titulo,
      slug: dados.slug,
      conteudo: dados.conteudo,
      status: dados.status,
      tituloSeo: dados.tituloSeo,
      descricaoSeo: dados.descricaoSeo,
      publicadaEm:
        dados.status === "publicada"
          ? (dados.publicadaEm ?? agora)
          : dados.publicadaEm,
      updatedAt: agora,
    };
    if (dados.id) {
      const [pagina] = await dbTransacional
        .update(paginasDinamicasTable)
        .set(valores)
        .where(eq(paginasDinamicasTable.id, dados.id))
        .returning({ id: paginasDinamicasTable.id });
      if (pagina) {
        revalidatePath("/admin/configuracoes/paginas-da-loja");
        revalidatePath(`/${dados.slug}`);
        if (paginaAnterior[0]?.slug && paginaAnterior[0].slug !== dados.slug)
          revalidatePath(`/${paginaAnterior[0].slug}`);
        revalidatePath("/sitemap.xml");
        revalidatePath("/", "layout");
      }
      return pagina
        ? { sucesso: true, dados: pagina }
        : { sucesso: false, mensagem: "Página não encontrada." };
    }
    const [pagina] = await dbTransacional
      .insert(paginasDinamicasTable)
      .values(valores)
      .returning({ id: paginasDinamicasTable.id });
    if (!pagina)
      return { sucesso: false, mensagem: "Não foi possível criar a página." };
    revalidatePath("/admin/configuracoes/paginas-da-loja");
    revalidatePath(`/${dados.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/", "layout");
    return { sucesso: true, dados: pagina };
  } catch (erro) {
    if (erro instanceof Error && erro.message === "NAO_AUTORIZADO")
      return {
        sucesso: false,
        mensagem: "Acesso administrativo não autorizado.",
      };
    if (ehViolacaoUnicidade(erro))
      return {
        sucesso: false,
        mensagem: "Este slug já está em uso.",
        campo: "slug",
      };
    return { sucesso: false, mensagem: "Não foi possível salvar a página." };
  }
}

export async function arquivarPaginaDinamica(
  entrada: unknown,
): Promise<ResultadoOperacaoPaginasDinamicas> {
  try {
    await exigirAdministradorPaginasDinamicas();
    const { id } = arquivarPaginaSchema.parse(entrada);
    const [pagina] = await dbTransacional
      .update(paginasDinamicasTable)
      .set({ status: "arquivada", updatedAt: new Date() })
      .where(eq(paginasDinamicasTable.id, id))
      .returning({
        id: paginasDinamicasTable.id,
        slug: paginasDinamicasTable.slug,
      });
    if (pagina) {
      revalidatePath("/admin/configuracoes/paginas-da-loja");
      revalidatePath(`/${pagina.slug}`);
      revalidatePath("/sitemap.xml");
      revalidatePath("/", "layout");
    }
    return pagina
      ? { sucesso: true, dados: undefined }
      : { sucesso: false, mensagem: "Página não encontrada." };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem:
        erro instanceof Error && erro.message === "NAO_AUTORIZADO"
          ? "Acesso administrativo não autorizado."
          : "Não foi possível arquivar a página.",
    };
  }
}
