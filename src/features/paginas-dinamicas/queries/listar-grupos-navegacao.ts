import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  grupoPaginasTable,
  gruposNavegacaoTable,
  paginasDinamicasTable,
} from "@/db/schema";

import { exigirAdministradorPaginasDinamicas } from "../lib/backend-paginas-dinamicas";
import type { GrupoNavegacaoComPaginas } from "../types/paginas-dinamicas.types";

export async function listarGruposNavegacao(): Promise<
  GrupoNavegacaoComPaginas[]
> {
  await exigirAdministradorPaginasDinamicas();
  const grupos = await db
    .select()
    .from(gruposNavegacaoTable)
    .orderBy(
      asc(gruposNavegacaoTable.localExibicao),
      asc(gruposNavegacaoTable.ordem),
    );
  const vinculos = await db
    .select({ vinculo: grupoPaginasTable, pagina: paginasDinamicasTable })
    .from(grupoPaginasTable)
    .innerJoin(
      paginasDinamicasTable,
      eq(grupoPaginasTable.paginaId, paginasDinamicasTable.id),
    )
    .orderBy(asc(grupoPaginasTable.grupoId), asc(grupoPaginasTable.ordem));

  return grupos.map((grupo) => ({
    ...grupo,
    paginas: vinculos
      .filter(({ vinculo }) => vinculo.grupoId === grupo.id)
      .map(({ vinculo, pagina }) => ({ ...vinculo, pagina })),
  }));
}
