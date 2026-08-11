import "server-only";

import { asc, desc } from "drizzle-orm";

import { db } from "@/db/connection";
import { bannersHomeTable } from "@/db/schema";

import { bannerHomeSecundarioFallback } from "../lib/banners-home-fallback";

export async function listarBannersHomeAdmin() {
  const banners = await db
    .select()
    .from(bannersHomeTable)
    .orderBy(
      asc(bannersHomeTable.posicao),
      desc(bannersHomeTable.ativo),
      asc(bannersHomeTable.ordem),
      desc(bannersHomeTable.updatedAt),
    );

  const existeComplementarAtivo = banners.some(
    (banner) => banner.posicao === "secundario_direito" && banner.ativo,
  );

  // O fallback é conteúdo real do storefront. Enquanto ainda não houver um
  // registro ativo, ele aparece no gestor e vira persistido ao salvar.
  return existeComplementarAtivo
    ? banners
    : [...banners, bannerHomeSecundarioFallback];
}
