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
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";
import { processarEventoPedidoFidelidade } from "@/features/programa-fidelidade/lib/processar-evento-pedido-fidelidade";
import { registrarUsoCupomPromocao } from "@/features/promocoes/services";

import { ROTULO_FORMA_PAGAMENTO_NA_ENTREGA } from "../../constants/pagamento-na-entrega.constants";
import { confirmarRecebimentoPagamentoEntregaSchema } from "../../schemas/recebimento-pagamento-na-entrega.schema";
import type { EstadoRecebimentoPagamentoEntrega } from "../../types/pagamento-na-entrega.types";

/**
 * Dá baixa no dinheiro recebido na entrega.
 *
 * Esta action move dinheiro, então tem guarda de sessão própria na primeira linha: Server
 * Action é um endpoint HTTP como outro qualquer, e o guard do layout do admin protege a
 * navegação, não a chamada direta.
 *
 * A idempotência tem três camadas independentes, todas dentro da mesma transação:
 *
 * 1. `isNull(recebidoEm)` no UPDATE do registro de pagamento na entrega — se já houve
 *    baixa, nenhuma linha é afetada;
 * 2. CAS otimista `where status = "pending"` no pagamento — só transiciona a partir do
 *    estado esperado;
 * 3. o índice único em `pedidoId` garante que existe no máximo um registro por pedido.
 *
 * Zero linhas afetadas NÃO é erro: significa que outra requisição chegou primeiro. Nesse
 * caso a action devolve sucesso com "já confirmado", que é a resposta correta para um
 * duplo clique — o resultado desejado já está no banco.
 */
export async function confirmarRecebimentoPagamentoEntregaAdmin(
  _estadoAtual: EstadoRecebimentoPagamentoEntrega,
  formData: FormData,
): Promise<EstadoRecebimentoPagamentoEntrega> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PAGAMENTOS_ENTREGA.ADMINISTRAR);
  const sessao = await buscarSessaoAdmin();

  if (!sessao.autorizado || !sessao.sessao) {
    return {
      sucesso: false,
      mensagem: "Sessão de administrador inválida ou expirada.",
    };
  }

  const validacao = confirmarRecebimentoPagamentoEntregaSchema.safeParse({
    pedidoId: formData.get("pedidoId"),
    formaRecebida: formData.get("formaRecebida"),
    valorRecebidoEmCentavos: formData.get("valorRecebidoEmCentavos"),
    observacao: formData.get("observacao") ?? undefined,
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

      // Pedido cancelado não recebe baixa: o dinheiro não deveria ter entrado.
      if (pedido.status === "canceled" || pedido.status === "refunded") {
        return {
          sucesso: false,
          mensagem: `Não é possível confirmar recebimento de um pedido ${pedido.status === "canceled" ? "cancelado" : "reembolsado"}.`,
        };
      }

      const agora = new Date();

      // Camada 1: só age quando ainda não houve baixa.
      const registrosAtualizados = await tx
        .update(checkoutPedidoPagamentoEntregaTable)
        .set({
          recebidoEm: agora,
          recebidoPorUsuarioId: adminId,
          recebidoPorEmail: adminEmail,
          valorRecebidoEmCentavos: dados.valorRecebidoEmCentavos,
          observacaoRecebimento: dados.observacao,
          formaEscolhida: dados.formaRecebida,
          updatedAt: agora,
        })
        .where(
          and(
            eq(checkoutPedidoPagamentoEntregaTable.pedidoId, dados.pedidoId),
            isNull(checkoutPedidoPagamentoEntregaTable.recebidoEm),
          ),
        )
        .returning({ id: checkoutPedidoPagamentoEntregaTable.id });

      if (registrosAtualizados.length === 0) {
        // Alguém chegou primeiro. O estado desejado já está no banco.
        return { sucesso: true, mensagem: "Recebimento já estava confirmado." };
      }

      // Camada 2: CAS otimista no pagamento.
      await tx
        .update(checkoutPagamentosTable)
        .set({
          status: "paid",
          metodo: dados.formaRecebida,
          paidAt: agora,
          updatedAt: agora,
        })
        .where(
          and(
            eq(checkoutPagamentosTable.pedidoId, dados.pedidoId),
            eq(checkoutPagamentosTable.status, "pending"),
          ),
        );

      await tx
        .update(checkoutPedidosTable)
        .set({ status: "paid", pagamentoStatus: "paid", updatedAt: agora })
        .where(
          and(
            eq(checkoutPedidosTable.id, dados.pedidoId),
            eq(checkoutPedidosTable.pagamentoStatus, "pending"),
          ),
        );

      const formaMudou = registro.formaEscolhida !== dados.formaRecebida;
      const divergenciaDeValor =
        dados.valorRecebidoEmCentavos - registro.valorAReceberEmCentavos;

      await tx.insert(checkoutPedidoHistoricosTable).values({
        pedidoId: dados.pedidoId,
        tipo: "pagamento_recebido_na_entrega",
        descricao: `Recebimento confirmado em ${ROTULO_FORMA_PAGAMENTO_NA_ENTREGA[dados.formaRecebida]}.`,
        origem: "admin",
        usuarioAdminId: adminId,
        usuarioAdminEmail: adminEmail,
        statusAnterior: pedido.status,
        statusNovo: "paid",
        metadata: {
          formaEscolhidaPeloCliente: registro.formaEscolhida,
          formaRecebida: dados.formaRecebida,
          // Guardado explicitamente para a auditoria conseguir filtrar os casos em que o
          // cliente pagou de forma diferente da combinada.
          formaDivergente: formaMudou,
          valorAReceberEmCentavos: registro.valorAReceberEmCentavos,
          valorRecebidoEmCentavos: dados.valorRecebidoEmCentavos,
          divergenciaDeValorEmCentavos: divergenciaDeValor,
          observacao: dados.observacao,
        },
      });

      await processarEventoPedidoFidelidade(
        tx,
        dados.pedidoId,
        "pagamento_confirmado",
      );

      return { sucesso: true, mensagem: "Recebimento confirmado.", pedido };
    });

    if (resultado.sucesso && "pedido" in resultado && resultado.pedido) {
      /**
       * Cupom só é contabilizado agora.
       *
       * Nos pagamentos online quem faz isso é o webhook; um pedido pago na entrega nunca
       * passa por webhook nenhum, então sem esta chamada o cupom furaria o limite de uso.
       * A própria função é idempotente, então repetir não conta duas vezes.
       */
      if (resultado.pedido.codigoCupomAplicado) {
        await registrarUsoCupomPromocao({ pedidoId: dados.pedidoId });
      }
    }

    if (resultado.sucesso) {
      revalidatePath(`/admin/pedidos/${dados.pedidoId}`);
      revalidatePath("/admin/pedidos");
    }

    return { sucesso: resultado.sucesso, mensagem: resultado.mensagem };
  } catch (erro) {
    console.error(
      "[pagamento-na-entrega:confirmar-recebimento]",
      erro instanceof Error ? erro.message : erro,
    );

    return {
      sucesso: false,
      mensagem: "Não foi possível confirmar o recebimento.",
    };
  }
}
