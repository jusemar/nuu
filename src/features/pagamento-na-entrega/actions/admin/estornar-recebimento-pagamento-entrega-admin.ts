"use server";

import { and, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  checkoutPagamentosTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidoPagamentoEntregaTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

import { estornarRecebimentoPagamentoEntregaSchema } from "../../schemas/recebimento-pagamento-na-entrega.schema";
import type { EstadoRecebimentoPagamentoEntrega } from "./confirmar-recebimento-pagamento-entrega-admin";

/**
 * Desfaz uma baixa feita por engano, devolvendo o pedido ao estado pendente.
 *
 * Existe porque a confirmação é manual e humana: alguém confirma o pedido errado, ou
 * confirma antes de o dinheiro entrar de fato. Sem estorno, o único caminho seria mexer no
 * banco à mão.
 *
 * Não apaga nada — a baixa anterior fica registrada no histórico com quem a fez. O que se
 * desfaz é o estado, não o rastro.
 *
 * Trava simétrica à da confirmação: só age quando `recebidoEm` NÃO é nulo. Estornar duas
 * vezes não faz nada na segunda.
 */
export async function estornarRecebimentoPagamentoEntregaAdmin(
  _estadoAtual: EstadoRecebimentoPagamentoEntrega,
  formData: FormData,
): Promise<EstadoRecebimentoPagamentoEntrega> {
  const sessao = await buscarSessaoAdmin();

  if (!sessao.autorizado || !sessao.sessao) {
    return {
      sucesso: false,
      mensagem: "Sessão de administrador inválida ou expirada.",
    };
  }

  const validacao = estornarRecebimentoPagamentoEntregaSchema.safeParse({
    pedidoId: formData.get("pedidoId"),
    observacao: formData.get("observacao"),
  });

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: validacao.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const dados = validacao.data;
  const adminId = sessao.sessao.user.id;
  const adminEmail = sessao.sessao.user.email;

  try {
    const resultado = await dbTransacional.transaction(async (tx) => {
      const [registro] = await tx
        .select()
        .from(checkoutPedidoPagamentoEntregaTable)
        .where(eq(checkoutPedidoPagamentoEntregaTable.pedidoId, dados.pedidoId))
        .limit(1);

      if (!registro) {
        return {
          sucesso: false,
          mensagem: "Este pedido não é de pagamento na entrega.",
        };
      }

      const [pedido] = await tx
        .select()
        .from(checkoutPedidosTable)
        .where(eq(checkoutPedidosTable.id, dados.pedidoId))
        .limit(1);

      if (!pedido) {
        return { sucesso: false, mensagem: "Pedido não encontrado." };
      }

      // Estornar um pedido já enviado ou entregue não faz sentido operacional: a
      // mercadoria saiu. Nesse caso o caminho é reembolso, que é outro fluxo.
      if (["shipped", "delivered", "refunded"].includes(pedido.status)) {
        return {
          sucesso: false,
          mensagem: `Não é possível estornar um pedido com status "${pedido.status}".`,
        };
      }

      const agora = new Date();
      const recebimentoAnterior = {
        recebidoEm: registro.recebidoEm?.toISOString() ?? null,
        recebidoPorEmail: registro.recebidoPorEmail,
        valorRecebidoEmCentavos: registro.valorRecebidoEmCentavos,
        formaRegistrada: registro.formaEscolhida,
      };

      const atualizados = await tx
        .update(checkoutPedidoPagamentoEntregaTable)
        .set({
          recebidoEm: null,
          recebidoPorUsuarioId: null,
          recebidoPorEmail: null,
          valorRecebidoEmCentavos: null,
          observacaoRecebimento: `Estorno: ${dados.observacao}`,
          updatedAt: agora,
        })
        .where(
          and(
            eq(checkoutPedidoPagamentoEntregaTable.pedidoId, dados.pedidoId),
            isNotNull(checkoutPedidoPagamentoEntregaTable.recebidoEm),
          ),
        )
        .returning({ id: checkoutPedidoPagamentoEntregaTable.id });

      if (atualizados.length === 0) {
        return {
          sucesso: false,
          mensagem: "Este pedido não tem recebimento confirmado para estornar.",
        };
      }

      await tx
        .update(checkoutPagamentosTable)
        .set({ status: "pending", paidAt: null, updatedAt: agora })
        .where(eq(checkoutPagamentosTable.pedidoId, dados.pedidoId));

      await tx
        .update(checkoutPedidosTable)
        .set({
          status: "pending",
          pagamentoStatus: "pending",
          updatedAt: agora,
        })
        .where(eq(checkoutPedidosTable.id, dados.pedidoId));

      await tx.insert(checkoutPedidoHistoricosTable).values({
        pedidoId: dados.pedidoId,
        tipo: "status_alterado_manual",
        descricao: `Recebimento estornado. ${dados.observacao}`,
        origem: "admin",
        usuarioAdminId: adminId,
        usuarioAdminEmail: adminEmail,
        statusAnterior: pedido.status,
        statusNovo: "pending",
        // Preserva os dados da baixa desfeita: sem isso, o estorno apagaria a informação
        // de quem tinha confirmado e de quanto tinha sido recebido.
        metadata: { recebimentoAnterior, observacao: dados.observacao },
      });

      return { sucesso: true, mensagem: "Recebimento estornado." };
    });

    if (resultado.sucesso) {
      revalidatePath(`/admin/pedidos/${dados.pedidoId}`);
      revalidatePath("/admin/pedidos");
    }

    return resultado;
  } catch (erro) {
    console.error(
      "[pagamento-na-entrega:estornar-recebimento]",
      erro instanceof Error ? erro.message : erro,
    );

    return {
      sucesso: false,
      mensagem: "Não foi possível estornar o recebimento.",
    };
  }
}
