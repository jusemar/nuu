import "server-only";

import { asc, eq } from "drizzle-orm";

import {
  checkoutPedidoHistoricosTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type { PedidoAdminDetalhe } from "../../types/admin-pedidos.types";

export async function buscarPedidoAdminPorId(
  pedidoId: string,
): Promise<PedidoAdminDetalhe | null> {
  const pedido = await dbTransacional.query.checkoutPedidosTable.findFirst({
    where: eq(checkoutPedidosTable.id, pedidoId),
    with: {
      cliente: true,
      endereco: true,
      itens: true,
      pagamentos: true,
      logistica: true,
      historicos: {
        orderBy: [asc(checkoutPedidoHistoricosTable.createdAt)],
      },
    },
  });

  if (!pedido) {
    return null;
  }

  const pagamento = pedido.pagamentos[0] ?? null;

  return {
    id: pedido.id,
    numeroPedido: pedido.numeroPedido,
    status: pedido.status,
    pagamentoStatus: pedido.pagamentoStatus,
    gateway: pedido.gatewayPagamento,
    subtotalEmCentavos: pedido.subtotalEmCentavos,
    freteEmCentavos: pedido.freteEmCentavos,
    descontoEmCentavos: pedido.descontoEmCentavos,
    totalEmCentavos: pedido.totalEmCentavos,
    observacao: pedido.observacao,
    createdAt: pedido.createdAt,
    updatedAt: pedido.updatedAt,
    cliente: {
      nome: pedido.cliente.nome,
      email: pedido.cliente.email,
      telefone: pedido.cliente.telefone,
      documento: pedido.cliente.documento,
    },
    endereco: {
      cep: pedido.endereco.cep,
      rua: pedido.endereco.rua,
      numero: pedido.endereco.numero,
      complemento: pedido.endereco.complemento,
      bairro: pedido.endereco.bairro,
      cidade: pedido.endereco.cidade,
      estado: pedido.endereco.estado,
      observacao: pedido.endereco.observacao,
    },
    itens: pedido.itens.map((item) => ({
      id: item.id,
      nomeProduto: item.nomeProduto,
      varianteId: item.varianteId,
      nomeVariante: item.nomeVariante,
      atributosVariante: item.atributosVariante,
      skuProduto: item.skuProduto,
      modalidade: item.modalidade,
      prazoModalidade: item.prazoModalidade,
      quantidade: item.quantidade,
      precoUnitarioEmCentavos: item.precoUnitarioEmCentavos,
      totalEmCentavos: item.totalEmCentavos,
    })),
    pagamento: pagamento
      ? {
          id: pagamento.id,
          gateway: pagamento.gateway,
          metodo: pagamento.metodo,
          status: pagamento.status,
          valorEmCentavos: pagamento.valorEmCentavos,
          transactionId: pagamento.transactionId,
          pixTxid: pagamento.pixTxid,
          copiaECola: pagamento.copiaECola,
          expiresAt: pagamento.expiresAt,
          paidAt: pagamento.paidAt,
          providerResponse: pagamento.providerResponse,
          createdAt: pagamento.createdAt,
          updatedAt: pagamento.updatedAt,
        }
      : null,
    logistica: pedido.logistica
      ? {
          id: pedido.logistica.id,
          transportadora: pedido.logistica.transportadora,
          codigoRastreio: pedido.logistica.codigoRastreio,
          dataEnvio: pedido.logistica.dataEnvio,
          dataEntrega: pedido.logistica.dataEntrega,
          updatedAt: pedido.logistica.updatedAt,
        }
      : null,
    historicos: pedido.historicos.map((historico) => ({
      id: historico.id,
      tipo: historico.tipo,
      descricao: historico.descricao,
      origem: historico.origem,
      statusAnterior: historico.statusAnterior,
      statusNovo: historico.statusNovo,
      createdAt: historico.createdAt,
    })),
  };
}
