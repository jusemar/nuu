import "server-only";

import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";

import { db } from "@/db/connection";
import { bannersHomeTable } from "@/db/schema";

import type { BannersHomeAtivos } from "../types/banners-home.types";

export async function buscarBannersHomeAtivos(): Promise<BannersHomeAtivos> {
  const agora = new Date();
  const banners = await db
    .select()
    .from(bannersHomeTable)
    .where(
      and(
        eq(bannersHomeTable.ativo, true),
        or(
          isNull(bannersHomeTable.dataInicio),
          lte(bannersHomeTable.dataInicio, agora),
        ),
        or(
          isNull(bannersHomeTable.dataFim),
          gte(bannersHomeTable.dataFim, agora),
        ),
      ),
    )
    .orderBy(asc(bannersHomeTable.ordem), asc(bannersHomeTable.createdAt));

  return {
    principalEsquerdo: banners.filter(
      (banner) => banner.posicao === "principal_esquerdo",
    ),
    secundarioDireito:
      banners.find((banner) => banner.posicao === "secundario_direito") ?? null,
    novidadesSecundarioEsquerdo:
      banners.find(
        (banner) => banner.posicao === "novidades_secundario_esquerdo",
      ) ?? null,
    novidadesSecundarioDireito:
      banners.find(
        (banner) => banner.posicao === "novidades_secundario_direito",
      ) ?? null,
    produtoInstitucional:
      banners.find((banner) => banner.posicao === "produto_institucional") ??
      null,
  };
}

export async function buscarBannerHomeAtivoPorPosicao(
  posicao: import("../types/banners-home.types").PosicaoBannerHome,
) {
  const agora = new Date();
  const [banner] = await db
    .select()
    .from(bannersHomeTable)
    .where(
      and(
        eq(bannersHomeTable.ativo, true),
        eq(bannersHomeTable.posicao, posicao),
        or(
          isNull(bannersHomeTable.dataInicio),
          lte(bannersHomeTable.dataInicio, agora),
        ),
        or(
          isNull(bannersHomeTable.dataFim),
          gte(bannersHomeTable.dataFim, agora),
        ),
      ),
    )
    .orderBy(asc(bannersHomeTable.ordem), asc(bannersHomeTable.createdAt))
    .limit(1);

  return banner ?? null;
}
