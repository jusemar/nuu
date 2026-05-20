"use server";

import { db } from "@/db/connection";
import { cities } from "@/db/table/logistics/cities/cities";
import {
  bairrosAvulsos,
  regioBairros,
  productOwnDeliveryPrices,
  shippingPendingNeighborhoods,
  shippingRegionCepRanges,
  shippingRegions,
  shippingZipAddresses,
  cepsEspecificos,
} from "@/db/table/logistics/entrega-propria";
import { states } from "@/db/table/logistics/states/states";
import { gerarFaixasContiguasDeCeps } from "../lib/cep-ranges";
import { and, eq, inArray, sql } from "drizzle-orm";

export type EntregaPropriaEstadoResumo = {
  uf: string;
  name: string;
  isActive: boolean;
  cidadesCount: number;
  regioesCount: number;
};

export type EntregaPropriaCidadeResumo = {
  id: number;
  name: string;
  stateUf: string;
  isActive: boolean;
  regioesCount: number;
  bairrosEmRegioesCount: number;
  bairrosPendentesCount: number;
};

export type EntregaPropriaRegiaoResumo = {
  id: number;
  name: string;
  description: string | null;
  city: string;
  state: string;
  isActive: boolean;
  bairrosCount: number;
  createdAt: Date;
};

export type EntregaPropriaBairroRegiao = {
  id: number;
  neighborhood: string;
  cepsCount: number;
  ceps: {
    cep: string;
    street: string;
  }[];
  cepRanges: {
    cepStart: string;
    cepEnd: string;
  }[];
};

export type EntregaPropriaBairroBaseLocal = {
  neighborhood: string;
  cepsCount: number;
  vinculado: boolean;
};

export type EntregaPropriaFaixaCepRegiao = {
  id: number;
  cepStart: string;
  cepEnd: string;
  source: string;
  isActive: boolean;
};

export type EntregaPropriaBairroPendente = {
  id: number;
  lastCep: string;
  neighborhood: string;
  city: string;
  state: string;
  consultationCount: number;
  lastConsultedAt: Date;
};

export type EntregaPropriaRegiaoDetalhe = EntregaPropriaRegiaoResumo & {
  bairros: EntregaPropriaBairroRegiao[];
  bairrosBaseLocal: EntregaPropriaBairroBaseLocal[];
  cepRanges: EntregaPropriaFaixaCepRegiao[];
  bairrosPendentes: EntregaPropriaBairroPendente[];
};

export type EntregaPropriaDestinoProduto = {
  type: "region" | "bairro-avulso" | "cep-especifico";
  id: number;
  label: string;
  city: string;
  state: string;
};

export type EntregaPropriaPrecoProduto = {
  id: number;
  destinationType: "region" | "bairro-avulso" | "cep-especifico";
  destinationId: number;
  destinationLabel: string;
  city: string;
  state: string;
  shippingPrice: number;
  deliveryDeadline: string | null;
  isActive: boolean;
};

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

async function listarNomesBairrosVinculadosNaCidade(
  stateUf: string,
  city: string,
): Promise<Set<string>> {
  const bairrosVinculados = await db
    .select({ neighborhood: regioBairros.neighborhood })
    .from(regioBairros)
    .innerJoin(shippingRegions, eq(regioBairros.regiaoId, shippingRegions.id))
    .where(
      and(eq(shippingRegions.state, stateUf), eq(shippingRegions.city, city)),
    );

  return new Set(
    bairrosVinculados.map((bairro) => bairro.neighborhood.toLowerCase()),
  );
}

export async function listarEstadosEntregaPropria(): Promise<
  EntregaPropriaEstadoResumo[]
> {
  const estados = await db.query.states.findMany({
    orderBy: (states, { asc }) => [asc(states.name)],
  });

  return Promise.all(
    estados.map(async (estado) => {
      const [cidadesResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cities)
        .where(eq(cities.stateUf, estado.uf));

      const [regioesResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(shippingRegions)
        .where(eq(shippingRegions.state, estado.uf));

      return {
        uf: estado.uf,
        name: estado.name,
        isActive: estado.isActive,
        cidadesCount: toNumber(cidadesResult?.count),
        regioesCount: toNumber(regioesResult?.count),
      };
    }),
  );
}

export async function buscarNomeEstadoEntregaPropria(
  uf: string,
): Promise<string | null> {
  const estado = await db.query.states.findFirst({
    where: eq(states.uf, uf),
    columns: {
      name: true,
    },
  });

  return estado?.name ?? null;
}

export async function listarCidadesEntregaPropria(
  stateUf: string,
): Promise<EntregaPropriaCidadeResumo[]> {
  const cidades = await db.query.cities.findMany({
    where: eq(cities.stateUf, stateUf),
    orderBy: (cities, { asc }) => [asc(cities.name)],
  });

  return Promise.all(
    cidades.map(async (cidade) => {
      const [regioesResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(shippingRegions)
        .where(
          and(
            eq(shippingRegions.state, cidade.stateUf),
            eq(shippingRegions.city, cidade.name),
          ),
        );

      const [bairrosRegiaoResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(regioBairros)
        .innerJoin(
          shippingRegions,
          eq(regioBairros.regiaoId, shippingRegions.id),
        )
        .where(
          and(
            eq(shippingRegions.state, cidade.stateUf),
            eq(shippingRegions.city, cidade.name),
          ),
        );

      const bairrosPendentesCidade =
        await db.query.shippingPendingNeighborhoods.findMany({
          where: and(
            eq(shippingPendingNeighborhoods.state, cidade.stateUf),
            eq(shippingPendingNeighborhoods.city, cidade.name),
            eq(shippingPendingNeighborhoods.status, "pending"),
          ),
          columns: {
            id: true,
          },
        });
      const bairrosAvulsosCidade = await db.query.bairrosAvulsos.findMany({
        where: and(
          eq(bairrosAvulsos.state, cidade.stateUf),
          eq(bairrosAvulsos.city, cidade.name),
        ),
        columns: {
          neighborhood: true,
        },
      });
      const bairrosVinculados = await listarNomesBairrosVinculadosNaCidade(
        cidade.stateUf,
        cidade.name,
      );
      const bairrosAvulsosPendentesCount = bairrosAvulsosCidade.filter(
        (bairro) => !bairrosVinculados.has(bairro.neighborhood.toLowerCase()),
      ).length;

      return {
        id: cidade.id,
        name: cidade.name,
        stateUf: cidade.stateUf,
        isActive: cidade.isActive,
        regioesCount: toNumber(regioesResult?.count),
        bairrosEmRegioesCount: toNumber(bairrosRegiaoResult?.count),
        bairrosPendentesCount:
          bairrosPendentesCidade.length + bairrosAvulsosPendentesCount,
      };
    }),
  );
}

export async function listarRegioesEntregaPropriaPorCidade(
  stateUf: string,
  city: string,
): Promise<EntregaPropriaRegiaoResumo[]> {
  const regioes = await db.query.shippingRegions.findMany({
    where: and(
      eq(shippingRegions.state, stateUf),
      eq(shippingRegions.city, city),
    ),
    orderBy: (shippingRegions, { asc }) => [asc(shippingRegions.name)],
    with: {
      bairros: true,
    },
  });

  return regioes.map((regiao) => ({
    id: regiao.id,
    name: regiao.name,
    description: regiao.description,
    city: regiao.city,
    state: regiao.state,
    isActive: regiao.isActive,
    bairrosCount: regiao.bairros.length,
    createdAt: regiao.createdAt,
  }));
}

export async function buscarRegiaoEntregaPropriaDetalhe(
  id: number,
): Promise<EntregaPropriaRegiaoDetalhe | null> {
  const regiao = await db.query.shippingRegions.findFirst({
    where: eq(shippingRegions.id, id),
    with: {
      bairros: true,
    },
  });

  if (!regiao) return null;

  const bairrosPendentes = await db.query.shippingPendingNeighborhoods.findMany(
    {
      where: and(
        eq(shippingPendingNeighborhoods.state, regiao.state),
        eq(shippingPendingNeighborhoods.city, regiao.city),
        eq(shippingPendingNeighborhoods.status, "pending"),
      ),
      orderBy: (shippingPendingNeighborhoods, { desc }) => [
        desc(shippingPendingNeighborhoods.consultationCount),
        desc(shippingPendingNeighborhoods.lastConsultedAt),
      ],
    },
  );
  const cepRanges = await db.query.shippingRegionCepRanges.findMany({
    where: eq(shippingRegionCepRanges.regionId, regiao.id),
    orderBy: (shippingRegionCepRanges, { asc }) => [
      asc(shippingRegionCepRanges.cepStart),
    ],
  });
  const bairrosVinculados = regiao.bairros.map((bairro) => bairro.neighborhood);
  const cepsPorBairro =
    bairrosVinculados.length > 0
      ? await db.query.shippingZipAddresses.findMany({
          where: and(
            eq(shippingZipAddresses.state, regiao.state),
            eq(shippingZipAddresses.city, regiao.city),
            inArray(shippingZipAddresses.neighborhood, bairrosVinculados),
          ),
          columns: {
            cep: true,
            neighborhood: true,
            street: true,
          },
          orderBy: (shippingZipAddresses, { asc }) => [
            asc(shippingZipAddresses.neighborhood),
            asc(shippingZipAddresses.cep),
          ],
        })
      : [];
  const cepsAgrupadosPorBairro = new Map<
    string,
    { cep: string; street: string }[]
  >();

  cepsPorBairro.forEach((address) => {
    const bairroCeps = cepsAgrupadosPorBairro.get(address.neighborhood) ?? [];
    bairroCeps.push({
      cep: address.cep,
      street: address.street,
    });
    cepsAgrupadosPorBairro.set(address.neighborhood, bairroCeps);
  });
  const bairrosVinculadosNaCidade = await listarNomesBairrosVinculadosNaCidade(
    regiao.state,
    regiao.city,
  );
  const bairrosBaseLocal = await db
    .select({
      neighborhood: shippingZipAddresses.neighborhood,
      cepsCount: sql<number>`count(*)`,
    })
    .from(shippingZipAddresses)
    .where(
      and(
        eq(shippingZipAddresses.state, regiao.state),
        eq(shippingZipAddresses.city, regiao.city),
      ),
    )
    .groupBy(shippingZipAddresses.neighborhood)
    .orderBy(shippingZipAddresses.neighborhood);

  return {
    id: regiao.id,
    name: regiao.name,
    description: regiao.description,
    city: regiao.city,
    state: regiao.state,
    isActive: regiao.isActive,
    bairrosCount: regiao.bairros.length,
    createdAt: regiao.createdAt,
    bairros: regiao.bairros.map((bairro) => {
      const ceps = cepsAgrupadosPorBairro.get(bairro.neighborhood) ?? [];

      return {
        id: bairro.id,
        neighborhood: bairro.neighborhood,
        cepsCount: ceps.length,
        ceps,
        cepRanges: gerarFaixasContiguasDeCeps(
          ceps.map((address) => address.cep),
        ),
      };
    }),
    bairrosBaseLocal: bairrosBaseLocal.map((bairro) => ({
      neighborhood: bairro.neighborhood,
      cepsCount: toNumber(bairro.cepsCount),
      vinculado: bairrosVinculadosNaCidade.has(
        bairro.neighborhood.toLowerCase(),
      ),
    })),
    cepRanges: cepRanges.map((range) => ({
      id: range.id,
      cepStart: range.cepStart,
      cepEnd: range.cepEnd,
      source: range.source,
      isActive: range.isActive,
    })),
    bairrosPendentes: bairrosPendentes
      .filter(
        (bairro) =>
          !bairrosVinculadosNaCidade.has(bairro.neighborhood.toLowerCase()),
      )
      .map((bairro) => ({
        id: bairro.id,
        lastCep: bairro.lastCep,
        neighborhood: bairro.neighborhood,
        city: bairro.city,
        state: bairro.state,
        consultationCount: bairro.consultationCount,
        lastConsultedAt: bairro.lastConsultedAt,
      })),
  };
}

export async function listarDestinosEntregaPropriaProduto(): Promise<
  EntregaPropriaDestinoProduto[]
> {
  const [regioes, bairros, ceps] = await Promise.all([
    db.query.shippingRegions.findMany({
      orderBy: (shippingRegions, { asc }) => [
        asc(shippingRegions.state),
        asc(shippingRegions.city),
        asc(shippingRegions.name),
      ],
    }),
    db.query.bairrosAvulsos.findMany({
      orderBy: (bairrosAvulsos, { asc }) => [
        asc(bairrosAvulsos.state),
        asc(bairrosAvulsos.city),
        asc(bairrosAvulsos.neighborhood),
      ],
    }),
    db.query.cepsEspecificos.findMany({
      orderBy: (cepsEspecificos, { asc }) => [
        asc(cepsEspecificos.state),
        asc(cepsEspecificos.city),
        asc(cepsEspecificos.cep),
      ],
    }),
  ]);

  return [
    ...regioes.map((regiao) => ({
      type: "region" as const,
      id: regiao.id,
      label: regiao.name,
      city: regiao.city,
      state: regiao.state,
    })),
    ...bairros.map((bairro) => ({
      type: "bairro-avulso" as const,
      id: bairro.id,
      label: bairro.neighborhood,
      city: bairro.city,
      state: bairro.state,
    })),
    ...ceps.map((cep) => ({
      type: "cep-especifico" as const,
      id: cep.id,
      label: `${cep.cep.slice(0, 5)}-${cep.cep.slice(5)} - ${cep.neighborhood}`,
      city: cep.city,
      state: cep.state,
    })),
  ];
}

export async function listarPrecosEntregaPropriaProduto(
  productId: string,
): Promise<EntregaPropriaPrecoProduto[]> {
  const precos = await db.query.productOwnDeliveryPrices.findMany({
    where: eq(productOwnDeliveryPrices.productId, productId),
    orderBy: (productOwnDeliveryPrices, { asc }) => [
      asc(productOwnDeliveryPrices.destinationType),
      asc(productOwnDeliveryPrices.id),
    ],
    with: {
      region: true,
      bairroAvulso: true,
      cepEspecifico: true,
    },
  });

  return precos.map((preco) => {
    const destino =
      preco.destinationType === "region"
        ? preco.region
        : preco.destinationType === "bairro-avulso"
          ? preco.bairroAvulso
          : preco.cepEspecifico;

    const destinationId =
      preco.destinationType === "region"
        ? preco.regionId
        : preco.destinationType === "bairro-avulso"
          ? preco.bairroAvulsoId
          : preco.cepEspecificoId;

    return {
      id: preco.id,
      destinationType: preco.destinationType as
        | "region"
        | "bairro-avulso"
        | "cep-especifico",
      destinationId: destinationId ?? 0,
      destinationLabel:
        preco.destinationType === "cep-especifico" && preco.cepEspecifico
          ? `${preco.cepEspecifico.cep.slice(0, 5)}-${preco.cepEspecifico.cep.slice(5)} - ${preco.cepEspecifico.neighborhood}`
          : (destino as { name?: string; neighborhood?: string } | null)
              ?.name ||
            (destino as { name?: string; neighborhood?: string } | null)
              ?.neighborhood ||
            "Destino removido",
      city: (destino as { city?: string } | null)?.city || "",
      state: (destino as { state?: string } | null)?.state || "",
      shippingPrice: preco.shippingPrice,
      deliveryDeadline: preco.deliveryDeadline,
      isActive: preco.isActive,
    };
  });
}
