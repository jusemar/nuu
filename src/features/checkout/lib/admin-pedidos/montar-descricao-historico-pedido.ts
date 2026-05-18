import { PEDIDO_STATUS_LABEL } from "../../constants/admin-pedidos";
import type { PedidoStatusCheckout } from "../../types/pedidos-pagamentos.types";

export function montarDescricaoPedidoCriado(numeroPedido: string) {
  return `Pedido ${numeroPedido} criado no checkout.`;
}

export function montarDescricaoPagamentoAprovado(numeroPedido: string) {
  return `Pagamento do pedido ${numeroPedido} aprovado.`;
}

export function montarDescricaoAlteracaoManualStatus({
  numeroPedido,
  statusAnterior,
  statusNovo,
}: {
  numeroPedido: string;
  statusAnterior: PedidoStatusCheckout;
  statusNovo: PedidoStatusCheckout;
}) {
  return `Status do pedido ${numeroPedido} alterado manualmente de ${PEDIDO_STATUS_LABEL[statusAnterior]} para ${PEDIDO_STATUS_LABEL[statusNovo]}.`;
}

export function montarDescricaoRastreioAtualizado({
  numeroPedido,
  transportadora,
  codigoRastreio,
}: {
  numeroPedido: string;
  transportadora: string | null;
  codigoRastreio: string | null;
}) {
  const partes = [
    transportadora ? `transportadora ${transportadora}` : null,
    codigoRastreio ? `rastreio ${codigoRastreio}` : null,
  ].filter(Boolean);

  return partes.length > 0
    ? `Dados de logística do pedido ${numeroPedido} atualizados: ${partes.join(", ")}.`
    : `Dados de logística do pedido ${numeroPedido} atualizados.`;
}

export function montarDescricaoPedidoEnviado(numeroPedido: string) {
  return `Pedido ${numeroPedido} marcado como enviado.`;
}

export function montarDescricaoPedidoEntregue(numeroPedido: string) {
  return `Pedido ${numeroPedido} marcado como entregue.`;
}
