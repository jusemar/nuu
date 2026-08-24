import "server-only";

import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/db/connection";
import { paginasDinamicasTable } from "@/db/schema";

import { exigirAdministradorPaginasDinamicas } from "../lib/backend-paginas-dinamicas";
import { listarPaginasDinamicasSchema } from "../schemas/paginas-dinamicas.schema";
import type { ListagemPaginadaPaginasDinamicas } from "../types/paginas-dinamicas.types";

export async function listarPaginasDinamicas(
  entrada: unknown = {},
): Promise<ListagemPaginadaPaginasDinamicas> {
  await exigirAdministradorPaginasDinamicas();
  const filtros = listarPaginasDinamicasSchema.parse(entrada);
  const condicoes: SQL[] = [];
  if (filtros.status)
    condicoes.push(eq(paginasDinamicasTable.status, filtros.status));
  if (filtros.busca) {
    const busca = `%${filtros.busca}%`;
    const condicaoBusca = or(
      ilike(paginasDinamicasTable.titulo, busca),
      ilike(paginasDinamicasTable.slug, busca),
    );
    if (condicaoBusca) condicoes.push(condicaoBusca);
  }
  const where = condicoes.length ? and(...condicoes) : undefined;
  const [itens, [total]] = await Promise.all([
    db
      .select()
      .from(paginasDinamicasTable)
      .where(where)
      .orderBy(desc(paginasDinamicasTable.updatedAt))
      .limit(filtros.porPagina)
      .offset((filtros.pagina - 1) * filtros.porPagina),
    db.select({ valor: count() }).from(paginasDinamicasTable).where(where),
  ]);
  return {
    itens,
    total: total?.valor ?? 0,
    pagina: filtros.pagina,
    porPagina: filtros.porPagina,
  };
}
