// Query: busca configuração de retirada de um produto específico
// Server-only

import { db } from "@/db/connection";
import { produtoRetiradaTable } from "@/db/table/retirada";
import { eq } from "drizzle-orm";

export async function buscarProdutoRetirada(productId: string) {
  return db
    .select()
    .from(produtoRetiradaTable)
    .where(eq(produtoRetiradaTable.productId, productId));
}