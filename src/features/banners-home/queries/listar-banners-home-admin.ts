import "server-only";

import { asc, desc } from "drizzle-orm";

import { db } from "@/db/connection";
import { bannersHomeTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { bannerHomeSecundarioFallback } from "../lib/banners-home-fallback";
import type { BannerHomeAdminDados } from "../types/banners-home.types";

export async function listarBannersHomeAdmin(): Promise<
  BannerHomeAdminDados[]
> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.BANNERS.ADMINISTRAR);
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
    : [
        ...banners,
        {
          ...bannerHomeSecundarioFallback,
          createdAt: null,
          updatedAt: null,
        },
      ];
}
