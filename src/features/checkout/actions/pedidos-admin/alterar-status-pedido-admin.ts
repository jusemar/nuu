"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  checkoutPedidoHistoricosTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { processarEventoPedidoFidelidade } from "@/features/programa-fidelidade/lib/processar-evento-pedido-fidelidade";

import { montarDescricaoAlteracaoManualStatus } from "../../lib/admin-pedidos/montar-descricao-historico-pedido";
import { alterarStatusPedidoAdminSchema } from "../../schemas/admin-pedidos.schema";
import { liberarAlocacoesEstoquePedido } from "../estoque/liberar-alocacoes-estoque-pedido";

export type EstadoAlterarStatusPedidoAdmin = {
  sucesso: boolean;
  mensagem: string | null;
};

export async function alterarStatusPedidoAdmin(
  _estadoAtual: EstadoAlterarStatusPedidoAdmin,
  formData: FormData,
): Promise<EstadoAlterarStatusPedidoAdmin> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PEDIDOS.ADMINISTRAR);
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

  if (status === "shipped" || status === "delivered") {
    return {
      sucesso: false,
      mensagem: "Use as ações de envio/entrega: elas validam estoque e registram o marco físico.",
    };
  }

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

      // Um pagamento reconhecido sem recursos não pode ser transformado em
      // pedido atendível por uma alteração genérica de status.
      if (["pagamento_recebido_sem_recursos", "expired", "canceled", "refunded"].includes(pedidoAtual.status) &&
          ["pending", "processing", "shipped", "delivered"].includes(status)) {
        return {
          atualizado: false,
          mensagem: "Pedido encerrado ou pago sem recursos não pode ser reativado por status manual. Encaminhe para tratamento/reembolso.",
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

      if (status === "canceled") {
        // Uma mudança manual a partir de enviado/entregue é apenas financeira:
        // jamais equivale ao retorno físico da mercadoria à loja.
        if (!["shipped", "delivered"].includes(pedidoAtual.status)) {
          await liberarAlocacoesEstoquePedido(tx, pedidoId);
        }
        await processarEventoPedidoFidelidade(tx, pedidoId, "pedido_cancelado");
      }

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
