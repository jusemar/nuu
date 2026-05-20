"use server";

import { db } from "@/db/connection";
import { shippingZipAddresses } from "@/db/table/logistics/entrega-propria";
import { eq } from "drizzle-orm";

export async function buscarEnderecoCepEntregaPropria(cep: string) {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    return null;
  }

  return db.query.shippingZipAddresses.findFirst({
    where: eq(shippingZipAddresses.cep, cleanCep),
  });
}
