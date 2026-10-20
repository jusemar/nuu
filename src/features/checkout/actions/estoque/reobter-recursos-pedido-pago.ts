import { and, eq, sql } from "drizzle-orm";

import {
  checkoutEstoqueAlocacoesTable,
  checkoutPedidoItensTable,
  checkoutPedidosTable,
  productVariantTable,
  reservasFidelidadeTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { modalidadePrecoExigeEstoqueLocal } from "@/features/precificacao/lib/normalizar-modalidade-preco";
import { reobterReservaLiberadaPedido } from "@/features/programa-fidelidade/lib/processar-resgate-fidelidade";

type TransacaoBanco = Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0];

class RecursosPedidoIndisponiveis extends Error {}

/**
 * Tenta reobter estoque e pontos históricos antes de tornar atendível um
 * pagamento tardio. O savepoint permite manter o pagamento `paid` no commit
 * externo mesmo quando a tentativa de recursos precisa sofrer rollback.
 */
export async function reobterRecursosPedidoPago(
  tx: TransacaoBanco,
  pedidoId: string,
): Promise<"prontos" | "indisponiveis"> {
  const [pedido] = await tx.select({
    status: checkoutPedidosTable.status,
    pontosResgatados: checkoutPedidosTable.pontosResgatados,
  }).from(checkoutPedidosTable).where(eq(checkoutPedidosTable.id, pedidoId));
  if (!pedido || ["canceled", "refunded", "shipped", "delivered", "pagamento_recebido_sem_recursos"].includes(pedido.status)) {
    return "indisponiveis";
  }

  const itens = await tx.select({
    varianteId: checkoutPedidoItensTable.varianteId,
    modalidade: checkoutPedidoItensTable.modalidade,
    quantidade: checkoutPedidoItensTable.quantidade,
  }).from(checkoutPedidoItensTable)
    .where(eq(checkoutPedidoItensTable.pedidoId, pedidoId));
  const quantidadePorVariante = new Map<string, number>();
  for (const item of itens) {
    if (!modalidadePrecoExigeEstoqueLocal(item.modalidade) && !item.modalidade?.startsWith("variant:")) continue;
    if (!item.varianteId) return "indisponiveis";
    quantidadePorVariante.set(item.varianteId, (quantidadePorVariante.get(item.varianteId) ?? 0) + item.quantidade);
  }

  const alocacoes = await tx.select({
    id: checkoutEstoqueAlocacoesTable.id,
    varianteId: checkoutEstoqueAlocacoesTable.varianteId,
    quantidade: checkoutEstoqueAlocacoesTable.quantidade,
    status: checkoutEstoqueAlocacoesTable.status,
  }).from(checkoutEstoqueAlocacoesTable)
    .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoId));
  // Falta de alocação em pedido que exige estoque próprio não é no-op: esse
  // pedido precisa de tratamento, pois não há responsabilidade física válida.
  if (alocacoes.length !== quantidadePorVariante.size ||
      alocacoes.some((alocacao) =>
        quantidadePorVariante.get(alocacao.varianteId) !== alocacao.quantidade ||
        alocacao.status === "comprometida")) {
    return "indisponiveis";
  }

  const [reserva] = await tx.select({ status: reservasFidelidadeTable.status })
    .from(reservasFidelidadeTable)
    .where(eq(reservasFidelidadeTable.pedidoId, pedidoId));
  if (Number(pedido.pontosResgatados ?? 0) > 0 && !reserva) return "indisponiveis";

  try {
    await tx.transaction(async (savepoint) => {
      for (const alocacao of alocacoes.sort((a, b) => a.varianteId.localeCompare(b.varianteId))) {
        if (alocacao.status === "alocada") continue;
        if (alocacao.status !== "liberada") throw new RecursosPedidoIndisponiveis();
        const [debitada] = await savepoint.update(productVariantTable)
          .set({
            stockQuantity: sql`${productVariantTable.stockQuantity} - ${alocacao.quantidade}`,
            updatedAt: new Date(),
          })
          .where(and(
            eq(productVariantTable.id, alocacao.varianteId),
            sql`${productVariantTable.stockQuantity} >= ${alocacao.quantidade}`,
          ))
          .returning({ id: productVariantTable.id });
        if (!debitada) throw new RecursosPedidoIndisponiveis();
        const [reativada] = await savepoint.update(checkoutEstoqueAlocacoesTable)
          .set({ status: "alocada", updatedAt: new Date() })
          .where(and(
            eq(checkoutEstoqueAlocacoesTable.id, alocacao.id),
            eq(checkoutEstoqueAlocacoesTable.status, "liberada"),
          ))
          .returning({ id: checkoutEstoqueAlocacoesTable.id });
        if (!reativada) throw new RecursosPedidoIndisponiveis();
      }

      if (reserva) {
        const pontos = await reobterReservaLiberadaPedido(savepoint, pedidoId);
        if (pontos !== "pronta") throw new RecursosPedidoIndisponiveis();
      }
    });
    return "prontos";
  } catch (erro) {
    if (erro instanceof RecursosPedidoIndisponiveis) return "indisponiveis";
    throw erro;
  }
}
