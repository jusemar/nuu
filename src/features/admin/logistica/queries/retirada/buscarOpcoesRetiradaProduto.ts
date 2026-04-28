// Query: DTO completo para exibir opções de retirada na loja (visão do cliente)
// Server-only — usa relations para trazer dados relacionados

import { db } from "@/db/connection";
import { produtoRetiradaTable } from "@/db/table/retirada";
import { eq, and } from "drizzle-orm";

export async function buscarOpcoesRetiradaProduto(productId: string) {
  const opcoes = await db.query.produtoRetirada.findMany({
    where: and(
      eq(produtoRetiradaTable.productId, productId),
      eq(produtoRetiradaTable.pontoColeta.ativo, true),
      eq(produtoRetiradaTable.modalidade.ativo, true)
    ),
    with: {
      pontoColeta: true,
      modalidade: true,
    },
  });

  return opcoes;
}