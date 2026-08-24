import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  grupoPaginasTable,
  gruposNavegacaoTable,
  paginasDinamicasTable,
} from "@/db/schema";

import { slugPaginaEhReservado } from "../lib/slugs-reservados";

export type GrupoRodapePublico = {
  id: string;
  titulo: string;
  links: Array<{ id: string; href: string; texto: string }>;
};

/** Retorna somente colunas que possuem ao menos um link publicável. */
export async function listarGruposRodapePublicos(): Promise<
  GrupoRodapePublico[]
> {
  const linhas = await db
    .select({
      grupoId: gruposNavegacaoTable.id,
      grupoTitulo: gruposNavegacaoTable.tituloPublico,
      vinculoId: grupoPaginasTable.id,
      textoLink: grupoPaginasTable.textoLink,
      paginaTitulo: paginasDinamicasTable.titulo,
      paginaSlug: paginasDinamicasTable.slug,
    })
    .from(gruposNavegacaoTable)
    .innerJoin(
      grupoPaginasTable,
      and(
        eq(grupoPaginasTable.grupoId, gruposNavegacaoTable.id),
        eq(grupoPaginasTable.ativo, true),
      ),
    )
    .innerJoin(
      paginasDinamicasTable,
      and(
        eq(paginasDinamicasTable.id, grupoPaginasTable.paginaId),
        eq(paginasDinamicasTable.status, "publicada"),
      ),
    )
    .where(
      and(
        eq(gruposNavegacaoTable.ativo, true),
        eq(gruposNavegacaoTable.localExibicao, "rodape"),
      ),
    )
    .orderBy(asc(gruposNavegacaoTable.ordem), asc(grupoPaginasTable.ordem));

  const grupos = new Map<string, GrupoRodapePublico>();
  for (const linha of linhas) {
    // Protege também eventuais registros legados anteriores à validação do admin.
    if (slugPaginaEhReservado(linha.paginaSlug)) continue;
    const grupo = grupos.get(linha.grupoId) ?? {
      id: linha.grupoId,
      titulo: linha.grupoTitulo,
      links: [],
    };
    grupo.links.push({
      id: linha.vinculoId,
      href: `/${linha.paginaSlug}`,
      texto: linha.textoLink?.trim() || linha.paginaTitulo,
    });
    grupos.set(linha.grupoId, grupo);
  }
  return [...grupos.values()];
}
