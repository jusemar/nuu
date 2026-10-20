import { and, eq, inArray, isNotNull, or, sql } from "drizzle-orm";

import {
  checkoutEstoqueAlocacoesTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidoLogisticasTable,
  checkoutPedidosTable,
  fornecedorPedidoIntegracoesTable,
  productVariantTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

type TransacaoBanco = Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0];

/**
 * Reage a um cancelamento já consolidado na mesma transação. Não cancela pedidos.
 * A linha de alocação é a autorização vinculante para devolver unidades: somente
 * quem mudou `alocada → liberada` pode incrementar a variante correspondente.
 */
export async function liberarAlocacoesEstoquePedido(
  tx: TransacaoBanco,
  pedidoId: string,
): Promise<{ alocacoesLiberadas: number; unidadesDevolvidas: number }> {
  const semEfeito = { alocacoesLiberadas: 0, unidadesDevolvidas: 0 };
  const [pedido] = await tx.select({
    status: checkoutPedidosTable.status,
    pagamentoStatus: checkoutPedidosTable.pagamentoStatus,
  })
    .from(checkoutPedidosTable)
    .where(eq(checkoutPedidosTable.id, pedidoId));
  // Expiração financeira só é terminal operacionalmente quando o pedido também
  // passou a `expired`; uma confirmação tardia deverá reobter os recursos antes
  // de voltar a `processing`.
  if (pedido?.status !== "canceled" &&
      !(pedido?.status === "expired" && pedido.pagamentoStatus === "expired")) {
    return semEfeito;
  }

  const [logistica] = await tx.select({
    dataEnvio: checkoutPedidoLogisticasTable.dataEnvio,
    dataEntrega: checkoutPedidoLogisticasTable.dataEntrega,
  }).from(checkoutPedidoLogisticasTable)
    .where(eq(checkoutPedidoLogisticasTable.pedidoId, pedidoId));
  if (logistica?.dataEnvio || logistica?.dataEntrega) return semEfeito;

  const [marcoEnvio] = await tx.select({ id: checkoutPedidoHistoricosTable.id })
    .from(checkoutPedidoHistoricosTable)
    .where(and(
      eq(checkoutPedidoHistoricosTable.pedidoId, pedidoId),
      inArray(checkoutPedidoHistoricosTable.statusNovo, ["shipped", "delivered"]),
    ))
    .limit(1);
  if (marcoEnvio) return semEfeito;

  const [externalizacao] = await tx.select({ id: fornecedorPedidoIntegracoesTable.id })
    .from(fornecedorPedidoIntegracoesTable)
    .where(and(
      eq(fornecedorPedidoIntegracoesTable.pedidoId, pedidoId),
      or(
        inArray(fornecedorPedidoIntegracoesTable.status, ["processando", "criado", "resultado_indeterminado"]),
        isNotNull(fornecedorPedidoIntegracoesTable.idPedidoExterno),
      ),
    ))
    .limit(1);
  if (externalizacao) return semEfeito;

  const alocacoes = await tx.select({
    id: checkoutEstoqueAlocacoesTable.id,
    varianteId: checkoutEstoqueAlocacoesTable.varianteId,
    quantidade: checkoutEstoqueAlocacoesTable.quantidade,
  }).from(checkoutEstoqueAlocacoesTable)
    .where(and(
      eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoId),
      eq(checkoutEstoqueAlocacoesTable.status, "alocada"),
    ));

  let alocacoesLiberadas = 0;
  let unidadesDevolvidas = 0;
  // Mesma ordem por variante usada na alocação, reduzindo deadlocks.
  for (const alocacao of alocacoes.sort((a, b) => a.varianteId.localeCompare(b.varianteId))) {
    const [liberada] = await tx.update(checkoutEstoqueAlocacoesTable)
      .set({ status: "liberada", updatedAt: new Date() })
      .where(and(
        eq(checkoutEstoqueAlocacoesTable.id, alocacao.id),
        eq(checkoutEstoqueAlocacoesTable.status, "alocada"),
      ))
      .returning({ quantidade: checkoutEstoqueAlocacoesTable.quantidade });
    if (!liberada) continue; // Retry ou concorrente já venceu a transição.

    const [variante] = await tx.update(productVariantTable)
      .set({
        stockQuantity: sql`${productVariantTable.stockQuantity} + ${liberada.quantidade}`,
        updatedAt: new Date(),
      })
      .where(eq(productVariantTable.id, alocacao.varianteId))
      .returning({ id: productVariantTable.id });
    if (!variante) throw new Error("VARIANTE_ALOCACAO_ESTOQUE_NAO_ENCONTRADA");
    alocacoesLiberadas += 1;
    unidadesDevolvidas += liberada.quantidade;
  }

  return { alocacoesLiberadas, unidadesDevolvidas };
}
