"use server";

/**
 * SERVICE routesService - CRUD de rotas de entrega
 *
 * Usa banco de dados real via Drizzle ORM.
 * A diretiva 'use server' garante execução no servidor.
 */

import { db } from "@/db";
import {
  deliveryRoutes,
  deliveryRouteSlots,
} from "@/db/table/logistics/deliveryRoutes/deliveryRoutes";
import { eq, and, gte, lte, not } from "drizzle-orm";
import type { CreateRouteData, CepTestResult } from "../types/routes";

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

async function getRouteWithSlots(routeId: number) {
  const route = await db.query.deliveryRoutes.findFirst({
    where: eq(deliveryRoutes.id, routeId),
  });

  if (!route) return null;

  const slots = await db.query.deliveryRouteSlots.findMany({
    where: eq(deliveryRouteSlots.routeId, routeId),
  });

  return {
    ...route,
    cepStartDisplay: formatCepDisplay(route.cepStart),
    cepEndDisplay: formatCepDisplay(route.cepEnd),
    slots: slots.map((slot) => ({
      ...slot,
      dayName: DAY_NAMES[slot.dayOfWeek] || "",
    })),
    hasActiveSlots: slots.some((s) => s.isActive),
  };
}

export async function getRoutes() {
  const routes = await db.query.deliveryRoutes.findMany({
    orderBy: deliveryRoutes.name,
  });

  const routesWithSlots = await Promise.all(
    routes.map(async (route) => {
      const slots = await db.query.deliveryRouteSlots.findMany({
        where: eq(deliveryRouteSlots.routeId, route.id),
      });

      return {
        ...route,
        cepStartDisplay: formatCepDisplay(route.cepStart),
        cepEndDisplay: formatCepDisplay(route.cepEnd),
        slots: slots.map((slot) => ({
          ...slot,
          dayName: DAY_NAMES[slot.dayOfWeek] || "",
        })),
        hasActiveSlots: slots.some((s) => s.isActive),
      };
    }),
  );

  return routesWithSlots;
}

export async function getRouteById(id: string) {
  return getRouteWithSlots(parseInt(id));
}

export async function testCep(cep: string): Promise<CepTestResult> {
  const cleanCep = cep.replace(/\D/g, "");

  const route = await db.query.deliveryRoutes.findFirst({
    where: and(
      eq(deliveryRoutes.isActive, true),
      lte(deliveryRoutes.cepStart, cleanCep),
      gte(deliveryRoutes.cepEnd, cleanCep),
    ),
  });

  if (!route) {
    return {
      found: false,
      message: `CEP ${cep} não está coberto por nenhuma rota ativa.`,
    };
  }

  const activeSlots = await db.query.deliveryRouteSlots.findMany({
    where: and(
      eq(deliveryRouteSlots.routeId, route.id),
      eq(deliveryRouteSlots.isActive, true),
    ),
  });

  return {
    found: true,
    route: {
      ...route,
      cepStartDisplay: formatCepDisplay(route.cepStart),
      cepEndDisplay: formatCepDisplay(route.cepEnd),
      slots: activeSlots.map((slot) => ({
        ...slot,
        dayName: DAY_NAMES[slot.dayOfWeek] || "",
      })),
      hasActiveSlots: true,
    },
    availableSlots: activeSlots.map((slot) => ({
      ...slot,
      dayName: DAY_NAMES[slot.dayOfWeek] || "",
    })),
    message: `CEP ${cep} coberto pela rota "${route.name}".`,
  };
}

export async function createRoute(data: CreateRouteData) {
  const [newRoute] = await db
    .insert(deliveryRoutes)
    .values({
      name: data.name,
      cepStart: data.cepStart,
      cepEnd: data.cepEnd,
      officialNeighborhood: data.officialNeighborhood,
      registeredNeighborhood: data.registeredNeighborhood,
      city: data.city,
      state: data.state,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (data.slots && data.slots.length > 0) {
    await db.insert(deliveryRouteSlots).values(
      data.slots.map((slot) => ({
        routeId: newRoute.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        shippingPrice: slot.shippingPrice,
        isActive: slot.isActive,
      })),
    );
  }

  return getRouteWithSlots(newRoute.id);
}

export async function updateRoute(id: string, data: any) {
  const routeId = parseInt(id);

  const updateData: Record<string, any> = { updatedAt: new Date() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.cepStart !== undefined) updateData.cepStart = data.cepStart;
  if (data.cepEnd !== undefined) updateData.cepEnd = data.cepEnd;
  if (data.registeredNeighborhood !== undefined)
    updateData.registeredNeighborhood = data.registeredNeighborhood;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await db
    .update(deliveryRoutes)
    .set(updateData)
    .where(eq(deliveryRoutes.id, routeId));

  return getRouteWithSlots(routeId);
}

export async function toggleRoute(id: string) {
  const routeId = parseInt(id);

  const route = await db.query.deliveryRoutes.findFirst({
    where: eq(deliveryRoutes.id, routeId),
  });

  if (!route) throw new Error("Rota não encontrada");

  await db
    .update(deliveryRoutes)
    .set({ isActive: !route.isActive, updatedAt: new Date() })
    .where(eq(deliveryRoutes.id, routeId));

  return getRouteWithSlots(routeId);
}

export async function deleteRoute(id: string) {
  const routeId = parseInt(id);
  await db.delete(deliveryRoutes).where(eq(deliveryRoutes.id, routeId));
}

export async function checkCepOverlap(
  cepStart: string,
  cepEnd: string,
  excludeRouteId?: string,
): Promise<boolean> {
  const cleanStart = cepStart.replace(/\D/g, "");
  const cleanEnd = cepEnd.replace(/\D/g, "");

  const conditions = [
    eq(deliveryRoutes.isActive, true),
    lte(deliveryRoutes.cepStart, cleanEnd),
    gte(deliveryRoutes.cepEnd, cleanStart),
  ];

  if (excludeRouteId) {
    conditions.push(not(eq(deliveryRoutes.id, parseInt(excludeRouteId))));
  }

  const overlappingRoute = await db.query.deliveryRoutes.findFirst({
    where: and(...conditions),
  });

  return overlappingRoute !== null;
}
