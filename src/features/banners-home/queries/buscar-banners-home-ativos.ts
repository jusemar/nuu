import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { bannersHomeTable } from "@/db/schema";

import type { BannersHomeAtivos } from "../types/banners-home.types";

export async function buscarBannersHomeAtivos(): Promise<BannersHomeAtivos> {
  const banners = await db
    .select()
    .from(bannersHomeTable)
    .where(eq(bannersHomeTable.ativo, true))
    .orderBy(asc(bannersHomeTable.ordem), asc(bannersHomeTable.createdAt));

  return {
    principalEsquerdo: banners.filter(
      (banner) => banner.posicao === "principal_esquerdo",
    ),
    secundarioDireito:
      banners.find((banner) => banner.posicao === "secundario_direito") ?? null,
  };
}

export async function buscarBannerHomeAtivoPorPosicao(
  posicao: "principal_esquerdo" | "secundario_direito",
) {
  const [banner] = await db
    .select()
    .from(bannersHomeTable)
    .where(
      and(
        eq(bannersHomeTable.ativo, true),
        eq(bannersHomeTable.posicao, posicao),
      ),
    )
    .orderBy(asc(bannersHomeTable.ordem), asc(bannersHomeTable.createdAt))
    .limit(1);

  return banner ?? null;
}
