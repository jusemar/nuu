"use server";

import { db } from "@/db/connection";
import type { NewShippingZipAddress } from "@/db/table/logistics/entrega-propria";
import { shippingZipAddresses } from "@/db/table/logistics/entrega-propria";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function salvarEnderecoCepEntregaPropria(
  data: NewShippingZipAddress,
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
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
