/**
 * SERVICE citiesService - Comunicação com API de cidades
 *
 * Usa Drizzle ORM para buscar dados reais do banco.
 */
"use server";

import { db } from "@/db/connection";
import { cities } from "@/db/table/logistics/cities/cities";
import { neighborhoods } from "@/db/table/logistics/neighborhoods/neighborhoods";
import { eq, sql } from "drizzle-orm";
import type { City } from "../types/cities";

/**
 * Busca todas as cidades (opcionalmente filtradas por estado)
 */
export async function getCities(stateUf?: string): Promise<City[]> {
  let query = db.select().from(cities);

  const citiesData = stateUf
    ? await query.where(eq(cities.stateUf, stateUf))
    : await query;

  const citiesWithCount = await Promise.all(
    citiesData.map(async (city) => {
      const neighborhoodsCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(neighborhoods)
        .where(eq(neighborhoods.cityId, city.id));

      return {
        id: city.id.toString(),
        name: city.name,
        stateUf: city.stateUf,
        isActive: city.isActive,
        neighborhoodsCount: neighborhoodsCountResult[0]?.count || 0,
        availableMethods: [],
        createdAt: city.createdAt,
        bairrosCount: neighborhoodsCountResult[0]?.count || 0,
        slotsConfigurados: city.hasSlotsConfigured,
      };
    }),
  );

  return citiesWithCount;
}

/**
 * Busca cidade por ID
 */
export async function getCityById(id: string): Promise<City | null> {
  const city = await db.query.cities.findFirst({
    where: eq(cities.id, parseInt(id)),
  });

  if (!city) return null;

  const neighborhoodsCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(neighborhoods)
    .where(eq(neighborhoods.cityId, city.id));

  return {
    id: city.id.toString(),
    name: city.name,
    stateUf: city.stateUf,
    isActive: city.isActive,
    neighborhoodsCount: neighborhoodsCountResult[0]?.count || 0,
    availableMethods: [],
    createdAt: city.createdAt,
    bairrosCount: neighborhoodsCountResult[0]?.count || 0,
    slotsConfigurados: city.hasSlotsConfigured,
  };
}

/**
 * Cria nova cidade
 */
export async function createCity(
  city: Omit<City, "id" | "createdAt">,
): Promise<City> {
  const [newCity] = await db
    .insert(cities)
    .values({
      name: city.name,
      stateUf: city.stateUf,
      isActive: city.isActive,
    })
    .returning();

  return {
    id: newCity.id.toString(),
    name: newCity.name,
    stateUf: newCity.stateUf,
    isActive: newCity.isActive,
    neighborhoodsCount: 0,
    availableMethods: [],
    createdAt: newCity.createdAt,
    bairrosCount: 0,
    slotsConfigurados: false,
  };
}

/**
 * Atualiza status da cidade
 */
export async function updateCityStatus(
  id: string,
  isActive: boolean,
): Promise<City> {
  const [updatedCity] = await db
    .update(cities)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(cities.id, parseInt(id)))
    .returning();

  if (!updatedCity) throw new Error("Cidade não encontrada");

  const neighborhoodsCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(neighborhoods)
    .where(eq(neighborhoods.cityId, updatedCity.id));

  return {
    id: updatedCity.id.toString(),
    name: updatedCity.name,
    stateUf: updatedCity.stateUf,
    isActive: updatedCity.isActive,
    neighborhoodsCount: neighborhoodsCountResult[0]?.count || 0,
    availableMethods: [],
    createdAt: updatedCity.createdAt,
    bairrosCount: neighborhoodsCountResult[0]?.count || 0,
    slotsConfigurados: updatedCity.hasSlotsConfigured,
  };
}

/**
 * Remove cidade
 */
export async function deleteCity(id: string): Promise<void> {
  await db.delete(cities).where(eq(cities.id, parseInt(id)));
}
