"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  checkoutPedidoHistoricosTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { montarDescricaoAlteracaoManualStatus } from "../../lib/admin-pedidos/montar-descricao-historico-pedido";
import { alterarStatusPedidoAdminSchema } from "../../schemas/admin-pedidos.schema";

export type EstadoAlterarStatusPedidoAdmin = {
  sucesso: boolean;
  mensagem: string | null;
};

export async function alterarStatusPedidoAdmin(
  _estadoAtual: EstadoAlterarStatusPedidoAdmin,
  formData: FormData,
): Promise<EstadoAlterarStatusPedidoAdmin> {
  const validacao = alterarStatusPedidoAdminSchema.safeParse({
    pedidoId: formData.get("pedidoId"),
    status: formData.get("status"),
  });

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: validacao.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { pedidoId, status } = validacao.data;

  try {
    const resultado = await dbTransacional.transaction(async (tx) => {
      const pedidoAtual = await tx.query.checkoutPedidosTable.findFirst({
        where: eq(checkoutPedidosTable.id, pedidoId),
      });

      if (!pedidoAtual) {
        return {
          atualizado: false,
          mensagem: "Pedido não encontrado.",
        };
      }

      if (pedidoAtual.status === status) {
        return {
          atualizado: true,
          mensagem: "O pedido já está com esse status.",
        };
      }

      const pedidosAtualizados = await tx
        .update(checkoutPedidosTable)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(checkoutPedidosTable.id, pedidoId),
            eq(checkoutPedidosTable.status, pedidoAtual.status),
          ),
        )
        .returning({
          id: checkoutPedidosTable.id,
          numeroPedido: checkoutPedidosTable.numeroPedido,
        });

      const pedidoAtualizado = pedidosAtualizados[0];

      if (!pedidoAtualizado) {
        return {
          atualizado: false,
          mensagem:
            "O status do pedido mudou durante a operação. Atualize a página e tente novamente.",
        };
      }

      await tx.insert(checkoutPedidoHistoricosTable).values({
        pedidoId,
        tipo: "status_alterado_manual",
        descricao: montarDescricaoAlteracaoManualStatus({
          numeroPedido: pedidoAtualizado.numeroPedido,
          statusAnterior: pedidoAtual.status,
          statusNovo: status,
        }),
        origem: "admin",
        statusAnterior: pedidoAtual.status,
        statusNovo: status,
        metadata: {
          operacao: "alteracao_manual_status_admin",
        },
      });

      return {
        atualizado: true,
        mensagem: "Status do pedido atualizado com sucesso.",
      };
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${pedidoId}`);

    return {
      sucesso: resultado.atualizado,
      mensagem: resultado.mensagem,
    };
  } catch (error) {
    console.error("Erro ao alterar status do pedido no admin.", {
      pedidoId,
      status,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      mensagem: "Não foi possível alterar o status do pedido.",
    };
  }
}
