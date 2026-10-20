"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  checkoutPedidoHistoricosTable,
  checkoutPedidoLogisticasTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { processarEventoPedidoFidelidade } from "@/features/programa-fidelidade/lib/processar-evento-pedido-fidelidade";

import { montarDescricaoPedidoEntregue } from "../../lib/admin-pedidos/montar-descricao-historico-pedido";
import { acaoLogisticaPedidoAdminSchema } from "../../schemas/admin-pedidos.schema";
import { comprometerAlocacoesEstoquePedido } from "../estoque/comprometer-alocacoes-estoque-pedido";

export type EstadoMarcarPedidoEntregueAdmin = {
  sucesso: boolean;
  mensagem: string | null;
};

export async function marcarPedidoEntregueAdmin(
  _estadoAtual: EstadoMarcarPedidoEntregueAdmin,
  formData: FormData,
): Promise<EstadoMarcarPedidoEntregueAdmin> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PEDIDOS.ADMINISTRAR);
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
      await tx.execute(sql`select id from checkout_pedidos where id = ${pedidoId} for update`);
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

      if (pedido.status === "delivered") {
        return { sucesso: true, mensagem: "Pedido já estava marcado como entregue." };
      }
      const marco = await comprometerAlocacoesEstoquePedido(tx, pedidoId, "entrega_em_maos");
      if (!marco.permitido) return { sucesso: false, mensagem: marco.mensagem };

      const agora = new Date();
      // Retirada entregue no balcão não possui envio por transportadora.
      const dataEnvio = marco.retirada ? null : (pedido.logistica?.dataEnvio ?? agora);

      await tx
        .insert(checkoutPedidoLogisticasTable)
        .values({
          pedidoId,
          dataEnvio,
          dataEntrega: agora,
          metadata: {
            origem: "admin",
          },
        })
        .onConflictDoUpdate({
          target: checkoutPedidoLogisticasTable.pedidoId,
          set: {
            dataEnvio,
            dataEntrega: pedido.logistica?.dataEntrega ?? agora,
            updatedAt: agora,
          },
        });

      await tx
        .update(checkoutPedidosTable)
        .set({
          status: "delivered",
          updatedAt: agora,
        })
        .where(eq(checkoutPedidosTable.id, pedidoId));

      await tx.insert(checkoutPedidoHistoricosTable).values({
        pedidoId,
        tipo: "pedido_entregue",
        descricao: montarDescricaoPedidoEntregue(pedido.numeroPedido),
        origem: "admin",
        statusAnterior: pedido.status,
        statusNovo: "delivered",
        metadata: {
          dataEntrega: (pedido.logistica?.dataEntrega ?? agora).toISOString(),
        },
      });

      await processarEventoPedidoFidelidade(tx, pedidoId, "pedido_entregue");

      return {
        sucesso: true,
        mensagem: "Pedido marcado como entregue.",
      };
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${pedidoId}`);

    return resultado;
  } catch (error) {
    console.error("Erro ao marcar pedido como entregue no admin.", {
      pedidoId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      mensagem: "Não foi possível marcar o pedido como entregue.",
    };
  }
}
