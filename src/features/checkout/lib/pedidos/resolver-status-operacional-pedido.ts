import type { PedidoStatusCheckout } from "../../types/pedidos-pagamentos.types";

export function resolverStatusOperacionalPedidoAposPagamento(
  statusAtual: PedidoStatusCheckout,
): PedidoStatusCheckout {
  if (
    statusAtual === "pending" ||
    statusAtual === "expired" ||
    statusAtual === "paid"
  ) {
    return "processing";
  }

  return statusAtual;
}
