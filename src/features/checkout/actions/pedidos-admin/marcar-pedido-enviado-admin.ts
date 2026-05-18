"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  checkoutPedidoHistoricosTable,
  checkoutPedidoLogisticasTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { montarDescricaoPedidoEnviado } from "../../lib/admin-pedidos/montar-descricao-historico-pedido";
import { acaoLogisticaPedidoAdminSchema } from "../../schemas/admin-pedidos.schema";

export type EstadoMarcarPedidoEnviadoAdmin = {
  sucesso: boolean;
  mensagem: string | null;
};

export async function marcarPedidoEnviadoAdmin(
  _estadoAtual: EstadoMarcarPedidoEnviadoAdmin,
  formData: FormData,
): Promise<EstadoMarcarPedidoEnviadoAdmin> {
  const validacao = acaoLogisticaPedidoAdminSchema.safeParse({
    pedidoId: formData.get("pedidoId"),
  });

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: validacao.error.issues[0]?.message ?? "Pedido inválido.",
    };
  }

  const { pedidoId } = validacao.data;

  try {
    const resultado = await dbTransacional.transaction(async (tx) => {
      const pedido = await tx.query.checkoutPedidosTable.findFirst({
        where: eq(checkoutPedidosTable.id, pedidoId),
        with: {
          logistica: true,
        },
      });

      if (!pedido) {
        return {
          sucesso: false,
          mensagem: "Pedido não encontrado.",
        };
      }

      const agora = new Date();

      await tx
        .insert(checkoutPedidoLogisticasTable)
        .values({
          pedidoId,
          dataEnvio: agora,
          metadata: {
            origem: "admin",
          },
        })
        .onConflictDoUpdate({
          target: checkoutPedidoLogisticasTable.pedidoId,
          set: {
            dataEnvio: pedido.logistica?.dataEnvio ?? agora,
            updatedAt: agora,
          },
        });

      await tx
        .update(checkoutPedidosTable)
        .set({
          status: "shipped",
          updatedAt: agora,
        })
        .where(eq(checkoutPedidosTable.id, pedidoId));

      await tx.insert(checkoutPedidoHistoricosTable).values({
        pedidoId,
        tipo: "pedido_enviado",
        descricao: montarDescricaoPedidoEnviado(pedido.numeroPedido),
        origem: "admin",
        statusAnterior: pedido.status,
        statusNovo: "shipped",
        metadata: {
          dataEnvio: (pedido.logistica?.dataEnvio ?? agora).toISOString(),
        },
      });

      return {
        sucesso: true,
        mensagem: "Pedido marcado como enviado.",
      };
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${pedidoId}`);

    return resultado;
  } catch (error) {
    console.error("Erro ao marcar pedido como enviado no admin.", {
      pedidoId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      mensagem: "Não foi possível marcar o pedido como enviado.",
    };
  }
}
