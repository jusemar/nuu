/**
 * SERVICE statesService - Comunicação com API de estados
 *
 * Usa Drizzle ORM para buscar dados reais do banco.
 */
"use server";

import { db } from "@/db";
import { states } from "@/db/table/logistics/states/states";
import { cities } from "@/db/table/logistics/cities/cities";
import { eq, sql } from "drizzle-orm";
import type { State } from "../types/states";

/**
 * Busca todos os estados com contagem de cidades
 */
export async function getStates(): Promise<State[]> {
  const statesData = await db.query.states.findMany({
    orderBy: (states, { asc }) => [asc(states.name)],
  });

  const statesWithCount = await Promise.all(
    statesData.map(async (state) => {
      const citiesCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(cities)
        .where(eq(cities.stateUf, state.uf));

      return {
        uf: state.uf,
        name: state.name,
        isActive: state.isActive,
        citiesCount: citiesCountResult[0]?.count || 0,
        createdAt: state.createdAt,
      };
    }),
  );

  return statesWithCount;
}

/**
 * Busca estado por UF
 */
export async function getStateByUf(uf: string): Promise<State | null> {
  const state = await db.query.states.findFirst({
    where: eq(states.uf, uf),
  });

  if (!state) return null;

  const citiesCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(cities)
    .where(eq(cities.stateUf, state.uf));

  return {
    uf: state.uf,
    name: state.name,
    isActive: state.isActive,
    citiesCount: citiesCountResult[0]?.count || 0,
    createdAt: state.createdAt,
  };
}

/**
 * Cria novo estado
 */
export async function createState(
  state: Omit<State, "createdAt">,
): Promise<State> {
  const [newState] = await db
    .insert(states)
    .values({
      uf: state.uf,
      name: state.name,
      isActive: state.isActive,
    })
    .returning();

  return {
    uf: newState.uf,
    name: newState.name,
    isActive: newState.isActive,
    citiesCount: 0,
    createdAt: newState.createdAt,
  };
}

/**
 * Atualiza status do estado (ativo/inativo)
 */
export async function updateStateStatus(
  uf: string,
  isActive: boolean,
): Promise<State> {
  const [updatedState] = await db
    .update(states)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(states.uf, uf))
    .returning();

  if (!updatedState) throw new Error("Estado não encontrado");

  const citiesCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(cities)
    .where(eq(cities.stateUf, updatedState.uf));

  return {
    uf: updatedState.uf,
    name: updatedState.name,
    isActive: updatedState.isActive,
    citiesCount: citiesCountResult[0]?.count || 0,
    createdAt: updatedState.createdAt,
  };
}

/**
 * Remove estado
 */
export async function deleteState(uf: string): Promise<void> {
  await db.delete(states).where(eq(states.uf, uf));
}
