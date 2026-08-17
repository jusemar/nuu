"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  checkoutPagamentosTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidoPagamentoEntregaTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";
import { processarEventoPedidoFidelidade } from "@/features/programa-fidelidade/lib/processar-evento-pedido-fidelidade";

import {
  registrarNaoRecebimentoPagamentoEntregaSchema,
  ROTULO_MOTIVO_NAO_RECEBIMENTO,
} from "../../schemas/recebimento-pagamento-na-entrega.schema";
import type { EstadoRecebimentoPagamentoEntrega } from "../../types/pagamento-na-entrega.types";

/**
 * Registra que o pagamento na entrega não se concretizou.
 *
 * Cobre os dois desfechos negativos: o cliente recusou pagar, ou a entrega não aconteceu.
 * Nos dois casos a mercadoria volta e o dinheiro não entrou, então o pagamento vai para
 * `failed` e o pedido para `canceled`.
 *
 * Os estados usam os enums que já existiam — nenhuma migration. `failed` e `canceled`
 * descrevem exatamente o que ocorreu; o motivo específico fica no histórico, que é onde a
 * operação consulta depois.
 *
 * Mesma trava da confirmação: só age enquanto `recebidoEm` é nulo. Um pedido que já teve
 * baixa não pode ser marcado como não recebido sem passar pelo estorno antes.
 */
export async function registrarNaoRecebimentoPagamentoEntregaAdmin(
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

  const validacao = registrarNaoRecebimentoPagamentoEntregaSchema.safeParse({
    pedidoId: formData.get("pedidoId"),
    motivo: formData.get("motivo"),
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

      if (registro.recebidoEm !== null) {
        return {
          sucesso: false,
          mensagem:
            "Este pedido já teve o recebimento confirmado. Faça o estorno antes de registrar não recebimento.",
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

      if (pedido.status === "canceled") {
        return { sucesso: true, mensagem: "Pedido já estava cancelado." };
      }

      const agora = new Date();

      // Marca o registro com a observação, mantendo `recebidoEm` nulo — o dinheiro não entrou.
      const atualizados = await tx
        .update(checkoutPedidoPagamentoEntregaTable)
        .set({
          observacaoRecebimento: `${ROTULO_MOTIVO_NAO_RECEBIMENTO[dados.motivo]}: ${dados.observacao}`,
          updatedAt: agora,
        })
        .where(
          and(
            eq(checkoutPedidoPagamentoEntregaTable.pedidoId, dados.pedidoId),
            isNull(checkoutPedidoPagamentoEntregaTable.recebidoEm),
          ),
        )
        .returning({ id: checkoutPedidoPagamentoEntregaTable.id });

      if (atualizados.length === 0) {
        return { sucesso: true, mensagem: "Ocorrência já registrada." };
      }

      await tx
        .update(checkoutPagamentosTable)
        .set({ status: "failed", updatedAt: agora })
        .where(
          and(
            eq(checkoutPagamentosTable.pedidoId, dados.pedidoId),
            eq(checkoutPagamentosTable.status, "pending"),
          ),
        );

      await tx
        .update(checkoutPedidosTable)
        .set({
          status: "canceled",
          pagamentoStatus: "failed",
          updatedAt: agora,
        })
        .where(eq(checkoutPedidosTable.id, dados.pedidoId));

      await tx.insert(checkoutPedidoHistoricosTable).values({
        pedidoId: dados.pedidoId,
        tipo: "status_alterado_manual",
        descricao: `${ROTULO_MOTIVO_NAO_RECEBIMENTO[dados.motivo]}. ${dados.observacao}`,
        origem: "admin",
        usuarioAdminId: adminId,
        usuarioAdminEmail: adminEmail,
        statusAnterior: pedido.status,
        statusNovo: "canceled",
        metadata: {
          motivo: dados.motivo,
          formaEscolhidaPeloCliente: registro.formaEscolhida,
          valorAReceberEmCentavos: registro.valorAReceberEmCentavos,
          observacao: dados.observacao,
        },
      });

      await processarEventoPedidoFidelidade(
        tx,
        dados.pedidoId,
        "pedido_cancelado",
      );

      return { sucesso: true, mensagem: "Ocorrência registrada." };
    });

    if (resultado.sucesso) {
      revalidatePath(`/admin/pedidos/${dados.pedidoId}`);
      revalidatePath("/admin/pedidos");
    }

    return resultado;
  } catch (erro) {
    console.error(
      "[pagamento-na-entrega:registrar-nao-recebimento]",
      erro instanceof Error ? erro.message : erro,
    );

    return {
      sucesso: false,
      mensagem: "Não foi possível registrar a ocorrência.",
    };
  }
}
