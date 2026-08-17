import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  carteirasFidelidadeTable,
  transacoesFidelidadeTable,
} from "@/db/schema";

/** Leitura preparada para Minha Conta futura; não concede nem resgata pontos. */
export async function buscarCarteiraFidelidadeCliente(clienteId: string) {
  const [carteira] = await db
    .select()
    .from(carteirasFidelidadeTable)
    .where(eq(carteirasFidelidadeTable.clienteId, clienteId))
    .limit(1);
  if (!carteira) return null;

  const transacoes = await db
    .select()
    .from(transacoesFidelidadeTable)
    .where(eq(transacoesFidelidadeTable.carteiraId, carteira.id))
    .orderBy(desc(transacoesFidelidadeTable.createdAt));

  return { carteira, transacoes };
}
