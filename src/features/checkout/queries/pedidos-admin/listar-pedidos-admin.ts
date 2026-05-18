import "server-only";

import { and, count, desc, eq, ilike, inArray, type SQL } from "drizzle-orm";

import {
  checkoutClientesTable,
  checkoutPagamentosTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { PEDIDOS_ADMIN_PAGE_SIZE } from "../../constants/admin-pedidos";
import type { FiltrosPedidosAdmin } from "../../schemas/admin-pedidos.schema";
import type { ResultadoListaPedidosAdmin } from "../../types/admin-pedidos.types";

async function buscarClientesIdsPorEmail(emailCliente?: string) {
  if (!emailCliente) {
    return null;
  }

  const clientes = await dbTransacional
    .select({ id: checkoutClientesTable.id })
    .from(checkoutClientesTable)
    .where(ilike(checkoutClientesTable.email, `%${emailCliente}%`));

  return clientes.map((cliente) => cliente.id);
}

async function buscarPedidosIdsPorPagamento({
  statusPagamento,
  metodoPagamento,
}: Pick<FiltrosPedidosAdmin, "statusPagamento" | "metodoPagamento">) {
  if (!statusPagamento && !metodoPagamento) {
    return null;
  }

  const filtrosPagamento: SQL[] = [];

  if (statusPagamento) {
    filtrosPagamento.push(eq(checkoutPagamentosTable.status, statusPagamento));
  }

  if (metodoPagamento) {
    filtrosPagamento.push(eq(checkoutPagamentosTable.metodo, metodoPagamento));
  }

  const pagamentos = await dbTransacional
    .select({ pedidoId: checkoutPagamentosTable.pedidoId })
    .from(checkoutPagamentosTable)
    .where(and(...filtrosPagamento));

  return [...new Set(pagamentos.map((pagamento) => pagamento.pedidoId))];
}

function montarFiltrosPedidos({
  filtros,
  clientesIds,
  pedidosIdsPorPagamento,
}: {
  filtros: FiltrosPedidosAdmin;
  clientesIds: string[] | null;
  pedidosIdsPorPagamento: string[] | null;
}) {
  const condicoes: SQL[] = [];

  if (filtros.statusPedido) {
    condicoes.push(eq(checkoutPedidosTable.status, filtros.statusPedido));
  }

  if (filtros.numeroPedido) {
    condicoes.push(
      ilike(checkoutPedidosTable.numeroPedido, `%${filtros.numeroPedido}%`),
    );
  }

  if (clientesIds) {
    condicoes.push(inArray(checkoutPedidosTable.clienteId, clientesIds));
  }

  if (pedidosIdsPorPagamento) {
    condicoes.push(inArray(checkoutPedidosTable.id, pedidosIdsPorPagamento));
  }

  return condicoes.length > 0 ? and(...condicoes) : undefined;
}

export async function listarPedidosAdmin(
  filtros: FiltrosPedidosAdmin,
): Promise<ResultadoListaPedidosAdmin> {
  const [clientesIds, pedidosIdsPorPagamento] = await Promise.all([
    buscarClientesIdsPorEmail(filtros.emailCliente),
    buscarPedidosIdsPorPagamento(filtros),
  ]);

  if (clientesIds?.length === 0 || pedidosIdsPorPagamento?.length === 0) {
    return {
      pedidos: [],
      total: 0,
      page: filtros.page,
      pageSize: PEDIDOS_ADMIN_PAGE_SIZE,
      totalPages: 1,
    };
  }

  const where = montarFiltrosPedidos({
    filtros,
    clientesIds,
    pedidosIdsPorPagamento,
  });
  const [{ total }] = await dbTransacional
    .select({ total: count() })
    .from(checkoutPedidosTable)
    .where(where);
  const totalPages = Math.max(1, Math.ceil(total / PEDIDOS_ADMIN_PAGE_SIZE));
  const page = Math.min(filtros.page, totalPages);
  const offset = (page - 1) * PEDIDOS_ADMIN_PAGE_SIZE;
  const pedidos = await dbTransacional.query.checkoutPedidosTable.findMany({
    where,
    orderBy: [desc(checkoutPedidosTable.createdAt)],
    limit: PEDIDOS_ADMIN_PAGE_SIZE,
    offset,
    with: {
      cliente: true,
      pagamentos: true,
    },
  });

  return {
    pedidos: pedidos.map((pedido) => {
      const pagamento = pedido.pagamentos[0] ?? null;

      return {
        id: pedido.id,
        numeroPedido: pedido.numeroPedido,
        cliente: {
          nome: pedido.cliente.nome,
          email: pedido.cliente.email,
        },
        totalEmCentavos: pedido.totalEmCentavos,
        status: pedido.status,
        pagamentoStatus: pedido.pagamentoStatus,
        gateway: pedido.gatewayPagamento,
        metodoPagamento: pagamento?.metodo ?? null,
        createdAt: pedido.createdAt,
      };
    }),
    total,
    page,
    pageSize: PEDIDOS_ADMIN_PAGE_SIZE,
    totalPages,
  };
}
