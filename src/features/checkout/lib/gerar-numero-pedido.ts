import { PREFIXO_NUMERO_PEDIDO } from "../constants/pedidos-pagamentos";

const TAMANHO_MINIMO_NUMERO_PEDIDO = 4;

export function formatarNumeroPedido(sequencial: number | string) {
  const numeroLimpo = String(sequencial).replace(/\D/g, "");

  if (!numeroLimpo) {
    throw new Error("Sequencial do pedido invalido.");
  }

  return `${PREFIXO_NUMERO_PEDIDO}${numeroLimpo.padStart(
    TAMANHO_MINIMO_NUMERO_PEDIDO,
    "0",
  )}`;
}
