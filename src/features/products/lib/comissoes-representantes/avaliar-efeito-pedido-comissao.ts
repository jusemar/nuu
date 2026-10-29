import type { DecisaoCancelamentoPedido } from "@/features/checkout/lib/cancelamentos/decidir-cancelamento-pedido";
import type {
  PagamentoStatusCheckout,
  PedidoStatusCheckout,
} from "@/features/checkout/types/pedidos-pagamentos.types";

/** Preparação para integração futura. Não altera pedido, snapshot ou qualquer saldo. */
export function avaliarEfeitoPedidoComissao(entrada: {
  status: PedidoStatusCheckout;
  pagamentoStatus: PagamentoStatusCheckout;
  reembolsoStatus?: "nao_necessario" | "processando" | "concluido" | "falhou";
  decisaoCancelamento?: DecisaoCancelamentoPedido;
}) {
  if (entrada.status === "refunded" || entrada.reembolsoStatus === "concluido")
    return "anular_por_estorno" as const;
  if (entrada.status === "canceled" || entrada.status === "expired")
    return "anular_por_cancelamento" as const;
  if (entrada.decisaoCancelamento === "orientar_devolucao")
    return "revisar_devolucao" as const;
  if (
    entrada.status === "pagamento_recebido_sem_recursos" ||
    entrada.reembolsoStatus === "processando" ||
    entrada.reembolsoStatus === "falhou"
  )
    return "revisar_antes_de_comissionar" as const;
  if (
    entrada.pagamentoStatus === "paid" &&
    ["paid", "processing", "shipped", "delivered"].includes(entrada.status)
  )
    return "avaliar_venda_valida" as const;
  return "aguardar" as const;
}
