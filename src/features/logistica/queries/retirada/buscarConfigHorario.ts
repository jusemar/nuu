// Query: busca configuração única de horário da loja
// Server-only — nunca usar em client components

import { db } from "@/db/connection";
import { configHorarioTable } from "@/db/table/retirada";

export async function buscarConfigHorario() {
  const [config] = await db.select().from(configHorarioTable).limit(1);

  return config ?? null;
}