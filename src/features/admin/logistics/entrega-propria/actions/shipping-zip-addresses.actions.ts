"use server";

import { db } from "@/db/connection";
import { shippingZipAddresses } from "@/db/table/logistics/entrega-propria";
import type { NewShippingZipAddress } from "@/db/table/logistics/entrega-propria";

export async function salvarEnderecoCepEntregaPropria(
  data: NewShippingZipAddress,
) {
  const cleanCep = data.cep.replace(/\D/g, "");
  const neighborhood = data.neighborhood.trim();
  const city = data.city.trim();
  const state = data.state.trim().toUpperCase();

  if (cleanCep.length !== 8 || !neighborhood || !city || state.length !== 2) {
    return null;
  }

  const now = new Date();

  const [address] = await db
    .insert(shippingZipAddresses)
    .values({
      cep: cleanCep,
      street: data.street?.trim() || "",
      complement: data.complement?.trim() || null,
      neighborhood,
      city,
      state,
      ibgeCode: data.ibgeCode?.trim() || null,
      source: data.source?.trim() || "external",
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    })
    .onConflictDoUpdate({
      target: shippingZipAddresses.cep,
      set: {
        street: data.street?.trim() || "",
        complement: data.complement?.trim() || null,
        neighborhood,
        city,
        state,
        ibgeCode: data.ibgeCode?.trim() || null,
        source: data.source?.trim() || "external",
        updatedAt: now,
        lastUsedAt: now,
      },
    })
    .returning();

  return address;
}
