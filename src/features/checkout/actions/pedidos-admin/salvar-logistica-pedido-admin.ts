"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  checkoutPedidoHistoricosTable,
  checkoutPedidoLogisticasTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { montarDescricaoRastreioAtualizado } from "../../lib/admin-pedidos/montar-descricao-historico-pedido";
import { salvarLogisticaPedidoAdminSchema } from "../../schemas/admin-pedidos.schema";

export type EstadoSalvarLogisticaPedidoAdmin = {
  sucesso: boolean;
  mensagem: string | null;
};

export async function salvarLogisticaPedidoAdmin(
  _estadoAtual: EstadoSalvarLogisticaPedidoAdmin,
  formData: FormData,
): Promise<EstadoSalvarLogisticaPedidoAdmin> {
  const validacao = salvarLogisticaPedidoAdminSchema.safeParse({
    pedidoId: formData.get("pedidoId"),
    transportadora: formData.get("transportadora"),
    codigoRastreio: formData.get("codigoRastreio"),
  });

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: validacao.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { pedidoId, transportadora, codigoRastreio } = validacao.data;

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

      const dadosIguais =
        (pedido.logistica?.transportadora ?? null) === transportadora &&
        (pedido.logistica?.codigoRastreio ?? null) === codigoRastreio;

      if (dadosIguais) {
        return {
          sucesso: true,
          mensagem: "Dados de logística já estão atualizados.",
        };
      }

      await tx
        .insert(checkoutPedidoLogisticasTable)
        .values({
          pedidoId,
          transportadora,
          codigoRastreio,
          metadata: {
            origem: "admin",
          },
        })
        .onConflictDoUpdate({
          target: checkoutPedidoLogisticasTable.pedidoId,
          set: {
            transportadora,
            codigoRastreio,
            updatedAt: new Date(),
          },
        });

      await tx.insert(checkoutPedidoHistoricosTable).values({
        pedidoId,
        tipo: "rastreio_atualizado",
        descricao: montarDescricaoRastreioAtualizado({
          numeroPedido: pedido.numeroPedido,
          transportadora,
          codigoRastreio,
        }),
        origem: "admin",
        statusAnterior: pedido.status,
        statusNovo: pedido.status,
        metadata: {
          transportadora,
          codigoRastreio,
        },
      });

      return {
        sucesso: true,
        mensagem: "Dados de logística atualizados com sucesso.",
      };
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${pedidoId}`);

    return resultado;
  } catch (error) {
    console.error("Erro ao salvar logística do pedido no admin.", {
      pedidoId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      mensagem: "Não foi possível salvar os dados de logística.",
    };
  }
}
