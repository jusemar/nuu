import { and, eq, sql } from "drizzle-orm";

import {
  checkoutEstoqueAlocacoesTable,
  checkoutPedidoItensTable,
  checkoutPedidoLogisticasTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { modalidadePrecoExigeEstoqueLocal } from "@/features/precificacao/lib/normalizar-modalidade-preco";

type TransacaoBanco = Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0];
type MarcoFisico = "envio" | "entrega_em_maos";

/**
 * Verifica o recurso físico e avança `alocada → comprometida` no primeiro
 * marco inequívoco. Não debita estoque: ele foi debitado ao criar/reobter.
 */
export async function comprometerAlocacoesEstoquePedido(
  tx: TransacaoBanco,
  pedidoId: string,
  marco: MarcoFisico,
): Promise<{ permitido: boolean; mensagem: string; transicoes: number; retirada: boolean }> {
  await tx.execute(sql`select id from checkout_pedidos where id = ${pedidoId} for update`);
  const [pedido] = await tx.select({
    status: checkoutPedidosTable.status,
    pagamentoStatus: checkoutPedidosTable.pagamentoStatus,
    gatewayPagamento: checkoutPedidosTable.gatewayPagamento,
  }).from(checkoutPedidosTable).where(eq(checkoutPedidosTable.id, pedidoId));
  const negar = (mensagem: string) => ({ permitido: false, mensagem, transicoes: 0, retirada: false });
  if (!pedido) return negar("Pedido não encontrado.");
  if (["canceled", "refunded", "expired", "pagamento_recebido_sem_recursos"].includes(pedido.status)) {
    return negar("Pedido encerrado ou pago sem recursos recuperados não pode ser expedido.");
  }
  if (pedido.gatewayPagamento !== "manual" && pedido.pagamentoStatus !== "paid") {
    return negar("Pagamento ainda não confirmado.");
  }

  const [logistica] = await tx.select({ snapshotFrete: checkoutPedidoLogisticasTable.snapshotFrete })
    .from(checkoutPedidoLogisticasTable)
    .where(eq(checkoutPedidoLogisticasTable.pedidoId, pedidoId));
  const snapshot = logistica?.snapshotFrete;
  const tipos = snapshot?.versao === "2"
    ? [...new Set(snapshot.grupos.map((grupo) => grupo.entrega.tipo))]
    : snapshot?.versao === "1"
      ? [...new Set(snapshot.itens.map((item) => item.provedor === "retirada" ? "retirada" : "entrega"))]
      : [];
  if (tipos.length !== 1) {
    return negar("A logística não possui um marco físico único; pedido misto ou snapshot ausente exige tratamento por grupo.");
  }
  const retirada = tipos[0] === "retirada";
  if (retirada && marco === "envio") return negar("Retirada na loja não sai por envio; confirme entrega em mãos.");
  if (!retirada && marco === "entrega_em_maos" && pedido.status !== "shipped") {
    return negar("Entrega precisa ser marcada como enviada antes de concluída.");
  }
  if (marco === "envio" && !["processing", "pending", "paid"].includes(pedido.status)) {
    return negar("Pedido não está apto a iniciar expedição.");
  }

  const itens = await tx.select({
    varianteId: checkoutPedidoItensTable.varianteId,
    modalidade: checkoutPedidoItensTable.modalidade,
    quantidade: checkoutPedidoItensTable.quantidade,
  }).from(checkoutPedidoItensTable).where(eq(checkoutPedidoItensTable.pedidoId, pedidoId));
  const necessidade = new Map<string, number>();
  for (const item of itens) {
    if (!modalidadePrecoExigeEstoqueLocal(item.modalidade) && !item.modalidade?.startsWith("variant:")) continue;
    if (!item.varianteId) return negar("Item de estoque próprio sem variante auditável.");
    necessidade.set(item.varianteId, (necessidade.get(item.varianteId) ?? 0) + item.quantidade);
  }
  const alocacoes = await tx.select().from(checkoutEstoqueAlocacoesTable)
    .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoId));
  if (alocacoes.length !== necessidade.size || alocacoes.some((alocacao) =>
    necessidade.get(alocacao.varianteId) !== alocacao.quantidade || alocacao.status === "liberada")) {
    return negar("Estoque próprio sem alocação válida; expedição bloqueada.");
  }
  let transicoes = 0;
  for (const alocacao of alocacoes.sort((a, b) => a.varianteId.localeCompare(b.varianteId))) {
    const [atualizada] = await tx.update(checkoutEstoqueAlocacoesTable)
      .set({ status: "comprometida", updatedAt: new Date() })
      .where(and(
        eq(checkoutEstoqueAlocacoesTable.id, alocacao.id),
        eq(checkoutEstoqueAlocacoesTable.status, "alocada"),
      ))
      .returning({ id: checkoutEstoqueAlocacoesTable.id });
    if (atualizada) transicoes += 1;
  }
  return { permitido: true, mensagem: "Marco físico confirmado.", transicoes, retirada };
}
