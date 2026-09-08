import type {
  PagamentoGatewayCheckout,
  PagamentoStatusCheckout,
  PedidoStatusCheckout,
} from "../../types/pedidos-pagamentos.types";

export type DecisaoCancelamentoPedido =
  | "cancelar_sem_reembolso"
  | "cancelar_com_reembolso"
  | "orientar_devolucao"
  | "bloquear_externalizado"
  | "ja_finalizado"
  | "gateway_nao_suportado";

/** Máquina de decisão pura; a Action repete toda a autorização dentro da transação. */
export function decidirCancelamentoPedido(entrada: {
  status: PedidoStatusCheckout;
  pagamentoStatus: PagamentoStatusCheckout;
  gateway: PagamentoGatewayCheckout;
  externalizado: boolean;
}): DecisaoCancelamentoPedido {
  if (entrada.status === "canceled" || entrada.status === "refunded") {
    return "ja_finalizado";
  }
  if (entrada.status === "shipped" || entrada.status === "delivered") {
    return "orientar_devolucao";
  }
  if (entrada.externalizado) return "bloquear_externalizado";
  if (entrada.pagamentoStatus !== "paid") return "cancelar_sem_reembolso";
  if (entrada.gateway === "stripe" || entrada.gateway === "efibank") {
    return "cancelar_com_reembolso";
  }
  return "gateway_nao_suportado";
}
