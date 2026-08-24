"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { shippingZipAddresses } from "@/db/table/logistics/entrega-propria";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function buscarEnderecoCepEntregaPropria(cep: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    return null;
  }

  return db.query.shippingZipAddresses.findFirst({
    where: eq(shippingZipAddresses.cep, cleanCep),
  });
}
