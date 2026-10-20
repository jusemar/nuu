import { and, eq, sql } from "drizzle-orm";

import { checkoutEstoqueAlocacoesTable, productVariantTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

type TransacaoBanco = Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0];

/** Débito vinculante, condicional e transacional usado por compra e recompensa. */
export async function alocarEstoqueLocalPedido(
  tx: TransacaoBanco,
  pedidoId: string,
  quantidadePorVariante: Map<string, number>,
) {
  // A ordem estável por UUID reduz deadlocks quando um pedido contém várias variantes.
  for (const [varianteId, quantidade] of [...quantidadePorVariante].sort(([a], [b]) => a.localeCompare(b))) {
    const [debitada] = await tx.update(productVariantTable).set({
      stockQuantity: sql`${productVariantTable.stockQuantity} - ${quantidade}`,
      updatedAt: new Date(),
    }).where(and(
      eq(productVariantTable.id, varianteId),
      sql`${productVariantTable.stockQuantity} >= ${quantidade}`,
    )).returning({ id: productVariantTable.id });
    if (!debitada) throw new Error("ESTOQUE_INSUFICIENTE_CONCORRENTE");
    await tx.insert(checkoutEstoqueAlocacoesTable).values({
      pedidoId,
      varianteId,
      quantidade,
      modalidade: "stock",
      status: "alocada",
    });
  }
}
