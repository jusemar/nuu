/**
 * SERVICE bairrosService - Comunicação com API de bairros
 *
 * Usa Drizzle ORM para buscar dados reais do banco.
 */
"use server";

import { db } from "@/db/connection";
import { cities } from "@/db/table/logistics/cities/cities";
import { neighborhoods } from "@/db/table/logistics/neighborhoods/neighborhoods";
import { eq, and, sql } from "drizzle-orm";
import type { Bairro, FaixaCep, SlotEntrega } from "../types/bairros";

/**
 * Dias da semana para slots
 */
const DIA_NOMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

/**
 * Converte dados do banco para tipo UI
 */
function toBairroType(dbBairro: any): Bairro {
  const cepRange: FaixaCep = dbBairro.cepRange || {
    inicio: "",
    fim: "",
    display: "",
  };
  const deliverySlots = dbBairro.deliverySlots || [];

  const slots: SlotEntrega[] = deliverySlots.map(
    (slot: any, index: number) => ({
      id: slot.id || `slot-${index}`,
      diaSemana: slot.dayOfWeek || slot.diaSemana || 0,
      diaNome: DIA_NOMES[slot.dayOfWeek] || slot.diaNome || "",
      horarioInicio: slot.startTime || slot.horarioInicio || "",
      horarioFim: slot.endTime || slot.horarioFim || "",
      preco: slot.price || slot.preco || 0,
      isActive: slot.isActive ?? true,
    }),
  );

  return {
    id: dbBairro.id.toString(),
    nome: dbBairro.name,
    cidade: dbBairro.cityName,
    estadoUf: dbBairro.stateUf,
    faixaCep: cepRange,
    slots,
    hasSlotsActive: slots.some((s) => s.isActive),
    isActive: dbBairro.isActive,
    totalEntregas: dbBairro.totalDeliveries || 0,
    createdAt: dbBairro.createdAt,
    updatedAt: dbBairro.updatedAt,
  };
}

/**
 * Busca todos os bairros (opcionalmente filtrados por cidade/estado)
 */
export async function getBairros(
  cidade?: string,
  estadoUf?: string,
): Promise<Bairro[]> {
  let query = db.select().from(neighborhoods);

  let bairrosData: any[];

  if (estadoUf && cidade) {
    const cityResult = await db
      .select()
      .from(cities)
      .where(and(eq(cities.stateUf, estadoUf), eq(cities.name, cidade)));

    if (cityResult.length === 0) return [];

    bairrosData = await query.where(eq(neighborhoods.cityId, cityResult[0].id));
  } else if (estadoUf) {
    bairrosData = await query.where(eq(neighborhoods.stateUf, estadoUf));
  } else {
    bairrosData = await query;
  }

  return bairrosData.map(toBairroType);
}

/**
 * Busca bairro por ID
 */
export async function getBairroById(id: string): Promise<Bairro | null> {
  const bairro = await db.query.neighborhoods.findFirst({
    where: eq(neighborhoods.id, parseInt(id)),
  });

  if (!bairro) return null;

  return toBairroType(bairro);
}

/**
 * Busca bairro por CEP
 */
export async function getBairroByCep(cep: string): Promise<Bairro | null> {
  const cepNumerico = cep.replace(/\D/g, "");

  if (cepNumerico.length !== 8) return null;

  const allBairros = await db.query.neighborhoods.findMany({
    where: eq(neighborhoods.isActive, true),
  });

  for (const bairro of allBairros) {
    const cepRange = bairro.cepRange as any;
    if (!cepRange || !cepRange.start || !cepRange.end) continue;

    if (cepNumerico >= cepRange.start && cepNumerico <= cepRange.end) {
      return toBairroType(bairro);
    }
  }

  return null;
}

/**
 * Cria novo bairro
 */
export async function createBairro(
  bairro: Omit<Bairro, "id" | "createdAt" | "updatedAt">,
): Promise<Bairro> {
  // Buscar ID da cidade pelo nome
  const cityResult = await db
    .select()
    .from(cities)
    .where(eq(cities.name, bairro.cidade));

  const cityId = cityResult[0]?.id || 0;

  const [newBairro] = await db
    .insert(neighborhoods)
    .values({
      name: bairro.nome,
      cityId: cityId,
      cityName: bairro.cidade,
      stateUf: bairro.estadoUf,
      cepRange: {
        start: bairro.faixaCep.inicio,
        end: bairro.faixaCep.fim,
        display: bairro.faixaCep.display,
      },
      deliverySlots: bairro.slots.map((s) => ({
        id: s.id,
        dayOfWeek: s.diaSemana,
        dayName: s.diaNome,
        startTime: s.horarioInicio,
        endTime: s.horarioFim,
        price: s.preco,
        isActive: s.isActive,
      })),
      hasActiveSlots: bairro.slots.some((s) => s.isActive),
      isActive: bairro.isActive,
    })
    .returning();

  return toBairroType(newBairro);
}

/**
 * Atualiza status do bairro
 */
export async function updateBairroStatus(
  id: string,
  isActive: boolean,
): Promise<Bairro> {
  const [updatedBairro] = await db
    .update(neighborhoods)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(neighborhoods.id, parseInt(id)))
    .returning();

  if (!updatedBairro) throw new Error("Bairro não encontrado");

  return toBairroType(updatedBairro);
}

/**
 * Atualiza slots do bairro
 */
export async function updateBairroSlots(
  id: string,
  slots: Bairro["slots"],
): Promise<Bairro> {
  const deliverySlots = slots.map((s) => ({
    id: s.id,
    dayOfWeek: s.diaSemana,
    dayName: s.diaNome,
    startTime: s.horarioInicio,
    endTime: s.horarioFim,
    price: s.preco,
    isActive: s.isActive,
  }));

  const [updatedBairro] = await db
    .update(neighborhoods)
    .set({
      deliverySlots,
      hasActiveSlots: slots.some((s) => s.isActive),
      updatedAt: new Date(),
    })
    .where(eq(neighborhoods.id, parseInt(id)))
    .returning();

  if (!updatedBairro) throw new Error("Bairro não encontrado");

  return toBairroType(updatedBairro);
}

/**
 * Remove bairro
 */
export async function deleteBairro(id: string): Promise<void> {
  await db.delete(neighborhoods).where(eq(neighborhoods.id, parseInt(id)));
}
