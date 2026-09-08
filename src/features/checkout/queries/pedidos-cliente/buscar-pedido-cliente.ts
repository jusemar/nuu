import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import {
  checkoutClientesTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidosTable,
  fornecedorPedidoIntegracoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type { PedidoClienteDetalhe } from "../../types/pedidos-cliente.types";

export async function buscarPedidoClientePorId({
  pedidoId,
  usuarioId,
}: {
  pedidoId: string;
  usuarioId: string;
}): Promise<PedidoClienteDetalhe | null> {
  const clientes = await dbTransacional
    .select({ id: checkoutClientesTable.id })
    .from(checkoutClientesTable)
    .where(eq(checkoutClientesTable.userId, usuarioId));

  if (clientes.length === 0) {
    return null;
  }

  const pedido = await dbTransacional.query.checkoutPedidosTable.findFirst({
    where: and(
      eq(checkoutPedidosTable.id, pedidoId),
      inArray(
        checkoutPedidosTable.clienteId,
        clientes.map((cliente) => cliente.id),
      ),
    ),
    with: {
      itens: true,
      pagamentos: true,
      logistica: true,
      cancelamento: true,
      historicos: {
        orderBy: [asc(checkoutPedidoHistoricosTable.createdAt)],
      },
    },
  });

  if (!pedido) {
    return null;
  }

  const pagamento = pedido.pagamentos[0] ?? null;
  const integracoes = await dbTransacional
    .select({
      status: fornecedorPedidoIntegracoesTable.status,
      idPedidoExterno: fornecedorPedidoIntegracoesTable.idPedidoExterno,
    })
    .from(fornecedorPedidoIntegracoesTable)
    .where(eq(fornecedorPedidoIntegracoesTable.pedidoId, pedido.id));
  const emFornecedor = integracoes.some(
    (item) =>
      ["processando", "criado", "resultado_indeterminado"].includes(
        item.status,
      ) || Boolean(item.idPedidoExterno),
  );
  const acaoPosVenda =
    pedido.cancelamento ||
    ["canceled", "refunded", "expired"].includes(pedido.status)
      ? null
      : ["shipped", "delivered"].includes(pedido.status)
        ? ("solicitar_devolucao" as const)
        : emFornecedor
          ? null
          : pedido.pagamentoStatus === "paid"
            ? ("solicitar_cancelamento" as const)
            : ("cancelar" as const);

  return {
    id: pedido.id,
    numeroPedido: pedido.numeroPedido,
    createdAt: pedido.createdAt,
    status: pedido.status,
    pagamentoStatus: pedido.pagamentoStatus,
    acaoPosVenda,
    cancelamento: pedido.cancelamento
      ? {
          status: pedido.cancelamento.status,
          reembolsoStatus: pedido.cancelamento.reembolsoStatus,
          motivo: pedido.cancelamento.motivo,
          complementoMotivo: pedido.cancelamento.complementoMotivo,
          solicitadoEm: pedido.cancelamento.solicitadoEm,
          erroOperacional: pedido.cancelamento.erroOperacional,
        }
      : null,
    subtotalEmCentavos: pedido.subtotalEmCentavos,
    freteEmCentavos: pedido.freteEmCentavos,
    descontoEmCentavos: pedido.descontoEmCentavos,
    totalEmCentavos: pedido.totalEmCentavos,
    itens: pedido.itens.map((item) => ({
      id: item.id,
      nomeProduto: item.nomeProduto,
      varianteId: item.varianteId,
      nomeVariante: item.nomeVariante,
      atributosVariante: item.atributosVariante,
      skuProduto: item.skuProduto,
      modalidade: item.modalidade,
      prazoModalidade: item.prazoModalidade,
      imagemUrl: item.imagemUrl,
      quantidade: item.quantidade,
      precoUnitarioEmCentavos: item.precoUnitarioEmCentavos,
      totalEmCentavos: item.totalEmCentavos,
    })),
    pagamento: pagamento
      ? {
          gateway: pagamento.gateway,
          metodo: pagamento.metodo,
          status: pagamento.status,
          qrCode: pagamento.qrCode,
          copiaECola: pagamento.copiaECola,
          expiresAt: pagamento.expiresAt,
          paidAt: pagamento.paidAt,
          createdAt: pagamento.createdAt,
        }
      : null,
    logistica: pedido.logistica
      ? {
          transportadora: pedido.logistica.transportadora,
          codigoRastreio: pedido.logistica.codigoRastreio,
          dataEnvio: pedido.logistica.dataEnvio,
          dataEntrega: pedido.logistica.dataEntrega,
        }
      : null,
    historicos: pedido.historicos.map((historico) => ({
      id: historico.id,
      tipo: historico.tipo,
      descricao: historico.descricao,
      origem: historico.origem,
      statusNovo: historico.statusNovo,
      createdAt: historico.createdAt,
    })),
  };
}
