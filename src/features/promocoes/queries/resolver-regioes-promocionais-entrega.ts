import "server-only";

import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "../../../db/connection";
import { shippingRegionCepRanges, shippingRegions } from "../../../db/schema";
import {
  montarCodigosRegiaoPromocional,
  normalizarCepPromocional,
} from "../lib/codigos-regiao-promocional";

export type EntradaResolverRegioesPromocionaisEntrega = {
  cep?: string | null;
  estado?: string | null;
  cidade?: string | null;
};

export async function resolverRegioesPromocionaisEntrega({
  cep,
  estado,
  cidade,
}: EntradaResolverRegioesPromocionaisEntrega) {
  const cepLimpo = normalizarCepPromocional(cep);
  const regioesEntregaIds: number[] = [];

  if (cepLimpo) {
    const regioesPorCep = await db
      .select({ id: shippingRegions.id })
      .from(shippingRegionCepRanges)
      .innerJoin(
        shippingRegions,
        eq(shippingRegionCepRanges.regionId, shippingRegions.id),
      )
      .where(
        and(
          eq(shippingRegionCepRanges.isActive, true),
          eq(shippingRegions.isActive, true),
          lte(shippingRegionCepRanges.cepStart, cepLimpo),
          gte(shippingRegionCepRanges.cepEnd, cepLimpo),
        ),
      )
      .limit(10);

    regioesEntregaIds.push(...regioesPorCep.map((regiao) => regiao.id));
  }

  return montarCodigosRegiaoPromocional({
    estado,
    cidade,
    regioesEntregaIds,
  });
}
