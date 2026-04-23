"use server";

/**
 * SERVICE shippingService - Sistema de Frete em 3 Níveis
 *
 * ⚠️ FUNCIONALIDADE VÁLIDA APENAS PARA ENTREGA PRÓPRIA
 *
 * Implementa a hierarquia de precificação:
 * [1] CEP Específico (exceções) → [2] Bairro em Região → [3] Bairro Avulso → [4] Não atendemos
 *
 * Usa banco de dados real via Drizzle ORM.
 * A diretiva 'use server' garante execução no servidor.
 */

import { db } from "@/db/connection";
import {
  shippingRegions,
  regioBairros,
  bairrosAvulsos,
  cepsEspecificos,
  shippingRegionSlots,
  shippingBairroAvulsoSlots,
} from "@/db/table/logistics/entrega-propria";
import { eq, and, or } from "drizzle-orm";
import type {
  ShippingRegion,
  RegioBairro,
  BairroAvulso,
  CepEspecifico,
  ShippingRegionSlot,
  ShippingBairroAvulsoSlot,
  NewShippingRegion,
  NewRegioBairro,
  NewBairroAvulso,
  NewCepEspecifico,
  NewShippingRegionSlot,
  NewShippingBairroAvulsoSlot,
} from "@/db/table/logistics/entrega-propria";

const DAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function formatCepDisplay(cep: string): string {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return cep;
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

/**
 * HIERARQUIA DE BUSCA DE FRETE
 *
 * Esta é a função principal que implementa a lógica de 3 níveis.
 * Procura na seguinte ordem:
 * [1] CEP específico (exceção)
 * [2] Bairro em região (padrão)
 * [3] Bairro avulso (isolado)
 * [4] Não atendemos
 *
 * @param cep - CEP com ou sem hífen
 * @param neighborhood - Nome do bairro (padronizado)
 * @param city - Cidade
 * @param state - UF
 * @returns Dados de frete ou erro
 */
export async function getShippingPrice(
  cep: string,
  neighborhood: string,
  city: string,
  state: string,
): Promise<ShippingPriceResult> {
  const cleanCep = cep.replace(/\D/g, "");

  // [1] BUSCA: CEP ESPECÍFICO
  const cepEspecifico = await db.query.cepsEspecificos.findFirst({
    where: and(
      eq(cepsEspecificos.cep, cleanCep),
      eq(cepsEspecificos.isActive, true),
    ),
  });

  if (cepEspecifico) {
    return {
      found: true,
      level: "cep-especifico",
      shippingPrice: cepEspecifico.shippingPrice,
      message: `CEP ${cep} com precificação especial: R$ ${(cepEspecifico.shippingPrice / 100).toFixed(2)}`,
      cep: cepEspecifico.cep,
      neighborhood: cepEspecifico.neighborhood,
      city: cepEspecifico.city,
      state: cepEspecifico.state,
    };
  }

  // [2] BUSCA: BAIRRO EM REGIÃO
  const regiaoComBairro = await db.query.regioBairros.findFirst({
    where: eq(regioBairros.neighborhood, neighborhood),
    with: {
      regiao: true,
    },
  });

  if (regiaoComBairro && regiaoComBairro.regiao.isActive) {
    const slots = await db.query.shippingRegionSlots.findMany({
      where: eq(shippingRegionSlots.regionId, regiaoComBairro.regiao.id),
    });

    return {
      found: true,
      level: "regiao",
      shippingPrice: regiaoComBairro.regiao.baseShippingPrice,
      message: `${neighborhood} atendido pela região "${regiaoComBairro.regiao.name}": R$ ${(regiaoComBairro.regiao.baseShippingPrice / 100).toFixed(2)}`,
      region: {
        id: regiaoComBairro.regiao.id,
        name: regiaoComBairro.regiao.name,
        city: regiaoComBairro.regiao.city,
        state: regiaoComBairro.regiao.state,
      },
      slots: slots.map((slot) => ({
        ...slot,
        dayName: DAY_NAMES[slot.dayOfWeek] || "",
      })),
    };
  }

  // [3] BUSCA: BAIRRO AVULSO
  const bairroAvulso = await db.query.bairrosAvulsos.findFirst({
    where: and(
      eq(bairrosAvulsos.neighborhood, neighborhood),
      eq(bairrosAvulsos.city, city),
      eq(bairrosAvulsos.state, state),
      eq(bairrosAvulsos.isActive, true),
    ),
  });

  if (bairroAvulso) {
    const slots = await db.query.shippingBairroAvulsoSlots.findMany({
      where: eq(shippingBairroAvulsoSlots.bairroAvulsoId, bairroAvulso.id),
    });

    return {
      found: true,
      level: "bairro-avulso",
      shippingPrice: bairroAvulso.baseShippingPrice,
      message: `${neighborhood} atendido como bairro avulso: R$ ${(bairroAvulso.baseShippingPrice / 100).toFixed(2)}`,
      bairro: {
        id: bairroAvulso.id,
        neighborhood: bairroAvulso.neighborhood,
        city: bairroAvulso.city,
        state: bairroAvulso.state,
      },
      slots: slots.map((slot) => ({
        ...slot,
        dayName: DAY_NAMES[slot.dayOfWeek] || "",
      })),
    };
  }

  // [4] NÃO ATENDEMOS
  return {
    found: false,
    message: `${neighborhood}, ${city} - ${state} não está coberto por nossas rotas de entrega própria.`,
  };
}

/**
 * OPERAÇÕES DE LEITURA - REGIÕES
 */

export async function getRegions() {
  const regions = await db.query.shippingRegions.findMany({
    orderBy: shippingRegions.name,
    with: {
      bairros: true,
      slots: true,
    },
  });

  return regions.map((region) => ({
    ...region,
    slots: region.slots.map((slot) => ({
      ...slot,
      dayName: DAY_NAMES[slot.dayOfWeek] || "",
    })),
  }));
}

export async function getRegionById(id: string) {
  const region = await db.query.shippingRegions.findFirst({
    where: eq(shippingRegions.id, parseInt(id)),
    with: {
      bairros: true,
      slots: true,
    },
  });

  if (!region) return null;

  return {
    ...region,
    slots: region.slots.map((slot) => ({
      ...slot,
      dayName: DAY_NAMES[slot.dayOfWeek] || "",
    })),
  };
}

export async function getBairrosAvulsos() {
  return db.query.bairrosAvulsos.findMany({
    orderBy: bairrosAvulsos.neighborhood,
    with: {
      slots: true,
    },
  });
}

export async function getBairroAvulsoById(id: string) {
  return db.query.bairrosAvulsos.findFirst({
    where: eq(bairrosAvulsos.id, parseInt(id)),
    with: {
      slots: true,
    },
  });
}

export async function getCepsEspecificos() {
  return db.query.cepsEspecificos.findMany({
    orderBy: cepsEspecificos.cep,
  });
}

/**
 * OPERAÇÕES DE CRIAÇÃO - REGIÕES
 */

export async function createRegion(data: {
  name: string;
  description?: string;
  city: string;
  state: string;
  baseShippingPrice: number;
  bairros: string[];
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}) {
  const [newRegion] = await db
    .insert(shippingRegions)
    .values({
      name: data.name,
      description: data.description,
      city: data.city,
      state: data.state,
      baseShippingPrice: data.baseShippingPrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Insere bairros
  if (data.bairros.length > 0) {
    await db.insert(regioBairros).values(
      data.bairros.map((bairro) => ({
        regiaoId: newRegion.id,
        neighborhood: bairro,
      })),
    );
  }

  // Insere slots
  if (data.slots.length > 0) {
    await db.insert(shippingRegionSlots).values(
      data.slots.map((slot) => ({
        regionId: newRegion.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: true,
      })),
    );
  }

  return getRegionById(newRegion.id.toString());
}

export async function updateRegion(
  id: string,
  data: {
    name?: string;
    description?: string;
    city?: string;
    state?: string;
    baseShippingPrice?: number;
    isActive?: boolean;
    bairros?: string[];
    slots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  },
) {
  const regionId = parseInt(id);

  const updateData: Record<string, any> = { updatedAt: new Date() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.baseShippingPrice !== undefined)
    updateData.baseShippingPrice = data.baseShippingPrice;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await db
    .update(shippingRegions)
    .set(updateData)
    .where(eq(shippingRegions.id, regionId));

  // Atualizar bairros se fornecidos
  if (data.bairros !== undefined) {
    await db.delete(regioBairros).where(eq(regioBairros.regiaoId, regionId));
    if (data.bairros.length > 0) {
      await db.insert(regioBairros).values(
        data.bairros.map((bairro) => ({
          regiaoId: regionId,
          neighborhood: bairro,
        })),
      );
    }
  }

  // Atualizar slots se fornecidos
  if (data.slots !== undefined) {
    await db
      .delete(shippingRegionSlots)
      .where(eq(shippingRegionSlots.regionId, regionId));
    if (data.slots.length > 0) {
      await db.insert(shippingRegionSlots).values(
        data.slots.map((slot) => ({
          regionId: regionId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: true,
        })),
      );
    }
  }

  return getRegionById(id);
}

export async function toggleRegion(id: string) {
  const regionId = parseInt(id);

  const region = await db.query.shippingRegions.findFirst({
    where: eq(shippingRegions.id, regionId),
  });

  if (!region) throw new Error("Região não encontrada");

  await db
    .update(shippingRegions)
    .set({ isActive: !region.isActive, updatedAt: new Date() })
    .where(eq(shippingRegions.id, regionId));

  return getRegionById(id);
}

export async function deleteRegion(id: string) {
  const regionId = parseInt(id);
  await db.delete(shippingRegions).where(eq(shippingRegions.id, regionId));
}

/**
 * OPERAÇÕES DE CRIAÇÃO - BAIRROS AVULSOS
 */

export async function createBairroAvulso(data: {
  neighborhood: string;
  city: string;
  state: string;
  baseShippingPrice: number;
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}) {
  const [newBairro] = await db
    .insert(bairrosAvulsos)
    .values({
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      baseShippingPrice: data.baseShippingPrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (data.slots.length > 0) {
    await db.insert(shippingBairroAvulsoSlots).values(
      data.slots.map((slot) => ({
        bairroAvulsoId: newBairro.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: true,
      })),
    );
  }

  return getBairroAvulsoById(newBairro.id.toString());
}

export async function updateBairroAvulso(
  id: string,
  data: {
    neighborhood?: string;
    city?: string;
    state?: string;
    baseShippingPrice?: number;
    isActive?: boolean;
    slots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  },
) {
  const bairroId = parseInt(id);

  const updateData: Record<string, any> = { updatedAt: new Date() };

  if (data.neighborhood !== undefined)
    updateData.neighborhood = data.neighborhood;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.baseShippingPrice !== undefined)
    updateData.baseShippingPrice = data.baseShippingPrice;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await db
    .update(bairrosAvulsos)
    .set(updateData)
    .where(eq(bairrosAvulsos.id, bairroId));

  // Atualizar slots se fornecidos
  if (data.slots !== undefined) {
    await db
      .delete(shippingBairroAvulsoSlots)
      .where(eq(shippingBairroAvulsoSlots.bairroAvulsoId, bairroId));
    if (data.slots.length > 0) {
      await db.insert(shippingBairroAvulsoSlots).values(
        data.slots.map((slot) => ({
          bairroAvulsoId: bairroId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: true,
        })),
      );
    }
  }

  return getBairroAvulsoById(id);
}

export async function toggleBairroAvulso(id: string) {
  const bairroId = parseInt(id);

  const bairro = await db.query.bairrosAvulsos.findFirst({
    where: eq(bairrosAvulsos.id, bairroId),
  });

  if (!bairro) throw new Error("Bairro avulso não encontrado");

  await db
    .update(bairrosAvulsos)
    .set({ isActive: !bairro.isActive, updatedAt: new Date() })
    .where(eq(bairrosAvulsos.id, bairroId));

  return getBairroAvulsoById(id);
}

export async function deleteBairroAvulso(id: string) {
  const bairroId = parseInt(id);
  await db.delete(bairrosAvulsos).where(eq(bairrosAvulsos.id, bairroId));
}

/**
 * OPERAÇÕES DE CRIAÇÃO - CEPs ESPECÍFICOS
 */

export async function createCepEspecifico(data: {
  cep: string;
  neighborhood: string;
  city: string;
  state: string;
  shippingPrice: number;
}) {
  const cleanCep = data.cep.replace(/\D/g, "");

  const [newCep] = await db
    .insert(cepsEspecificos)
    .values({
      cep: cleanCep,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      shippingPrice: data.shippingPrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newCep;
}

export async function updateCepEspecifico(
  id: string,
  data: {
    shippingPrice?: number;
    isActive?: boolean;
  },
) {
  const cepId = parseInt(id);

  const updateData: Record<string, any> = { updatedAt: new Date() };

  if (data.shippingPrice !== undefined)
    updateData.shippingPrice = data.shippingPrice;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await db
    .update(cepsEspecificos)
    .set(updateData)
    .where(eq(cepsEspecificos.id, cepId));

  return db.query.cepsEspecificos.findFirst({
    where: eq(cepsEspecificos.id, cepId),
  });
}

export async function toggleCepEspecifico(id: string) {
  const cepId = parseInt(id);

  const cep = await db.query.cepsEspecificos.findFirst({
    where: eq(cepsEspecificos.id, cepId),
  });

  if (!cep) throw new Error("CEP específico não encontrado");

  await db
    .update(cepsEspecificos)
    .set({ isActive: !cep.isActive, updatedAt: new Date() })
    .where(eq(cepsEspecificos.id, cepId));

  return db.query.cepsEspecificos.findFirst({
    where: eq(cepsEspecificos.id, cepId),
  });
}

export async function deleteCepEspecifico(id: string) {
  const cepId = parseInt(id);
  await db.delete(cepsEspecificos).where(eq(cepsEspecificos.id, cepId));
}

/**
 * TIPOS RETORNADOS
 */

export type ShippingPriceResult =
  | {
      found: true;
      level: "cep-especifico" | "regiao" | "bairro-avulso";
      shippingPrice: number;
      message: string;
      cep?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      region?: {
        id: number;
        name: string;
        city: string;
        state: string;
      };
      bairro?: {
        id: number;
        neighborhood: string;
        city: string;
        state: string;
      };
      slots?: Array<
        | (ShippingRegionSlot & { dayName: string })
        | (ShippingBairroAvulsoSlot & { dayName: string })
      >;
    }
  | {
      found: false;
      message: string;
    };
