import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { paginasDinamicasTable } from "@/db/schema";

import { slugPaginaEhReservado } from "../lib/slugs-reservados";
import { conteudoPaginaDinamicaSchema } from "../schemas/conteudo-pagina-dinamica.schema";

export async function buscarPaginaPublicadaPorSlug(slug: string) {
  if (slugPaginaEhReservado(slug)) return null;
  const [pagina] = await db
    .select()
    .from(paginasDinamicasTable)
    .where(
      and(
        eq(paginasDinamicasTable.slug, slug),
        eq(paginasDinamicasTable.status, "publicada"),
      ),
    )
    .limit(1);
  if (!pagina || pagina.status !== "publicada") return null;
  const conteudo = conteudoPaginaDinamicaSchema.safeParse(pagina.conteudo);
  return conteudo.success ? { ...pagina, conteudo: conteudo.data } : null;
}

export async function listarPaginasPublicadasSitemap() {
  const paginas = await db
    .select({
      slug: paginasDinamicasTable.slug,
      updatedAt: paginasDinamicasTable.updatedAt,
    })
    .from(paginasDinamicasTable)
    .where(eq(paginasDinamicasTable.status, "publicada"))
    .orderBy(asc(paginasDinamicasTable.slug));
  return paginas.filter(({ slug }) => !slugPaginaEhReservado(slug));
}
