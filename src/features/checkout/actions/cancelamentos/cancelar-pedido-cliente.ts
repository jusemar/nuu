"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  checkoutClientesTable,
  checkoutPagamentosTable,
  checkoutPedidoCancelamentosTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidosTable,
  fornecedorPedidoIntegracoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";
import { processarEventoPedidoFidelidade } from "@/features/programa-fidelidade/lib/processar-evento-pedido-fidelidade";

import { decidirCancelamentoPedido } from "../../lib/cancelamentos/decidir-cancelamento-pedido";
import {
  cancelarCobrancaPendente,
  reembolsarPagamento,
} from "../../lib/gateways/reembolsos";
import { cancelarPedidoClienteSchema } from "../../schemas/cancelamento-pedido.schema";

export type EstadoCancelarPedido = {
  sucesso: boolean;
  mensagem: string;
  estado?: "cancelado" | "reembolso_processando" | "devolucao" | "bloqueado";
};

const ESTADO_INICIAL: EstadoCancelarPedido = { sucesso: false, mensagem: "" };

function sanitizarErro(erro: unknown) {
  return (erro instanceof Error ? erro.message : "Falha desconhecida")
    .replace(/https?:\/\/\S+/giu, "[url-removida]")
    .slice(0, 500);
}

/** Server Action autoritativa: não aceita identidade, status ou valor vindos da tela. */
export async function cancelarPedidoCliente(
  _estado: EstadoCancelarPedido = ESTADO_INICIAL,
  formData: FormData,
): Promise<EstadoCancelarPedido> {
  const sessao = await buscarSessaoCliente();
  if (!sessao)
    return { sucesso: false, mensagem: "Entre na sua conta para continuar." };

  const validacao = cancelarPedidoClienteSchema.safeParse({
    pedidoId: formData.get("pedidoId"),
    motivo: formData.get("motivo"),
    complementoMotivo: formData.get("complementoMotivo") || undefined,
  });
  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: validacao.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const dados = validacao.data;
  const preparacao = await dbTransacional.transaction(async (tx) => {
    // Serializa confirmação, cancelamento e retries concorrentes deste pedido.
    await tx.execute(
      sql`select id from checkout_pedidos where id = ${dados.pedidoId} for update`,
    );
    const pedido = await tx.query.checkoutPedidosTable.findFirst({
      where: eq(checkoutPedidosTable.id, dados.pedidoId),
      with: { cliente: true, pagamentos: true, cancelamento: true },
    });
    if (!pedido || pedido.cliente.userId !== sessao.usuario.id)
      return { tipo: "nao_encontrado" as const };
    if (pedido.cancelamento) {
      return {
        tipo: "existente" as const,
        reembolsoStatus: pedido.cancelamento.reembolsoStatus,
        status: pedido.cancelamento.status,
      };
    }

    const integracoes = await tx
      .select({
        idPedidoExterno: fornecedorPedidoIntegracoesTable.idPedidoExterno,
        status: fornecedorPedidoIntegracoesTable.status,
      })
      .from(fornecedorPedidoIntegracoesTable)
      .where(eq(fornecedorPedidoIntegracoesTable.pedidoId, pedido.id));
    // "processando" já pode significar que o 00002 saiu pela rede; por segurança,
    // entra na mesma exceção do pedido externalizado e nunca dispara refund automático.
    const externalizado = integracoes.some(
      (item) =>
        ["processando", "criado", "resultado_indeterminado"].includes(
          item.status,
        ) || Boolean(item.idPedidoExterno),
    );
    const decisao = decidirCancelamentoPedido({
      status: pedido.status,
      pagamentoStatus: pedido.pagamentoStatus,
      gateway: pedido.gatewayPagamento,
      externalizado,
    });

    if (decisao === "orientar_devolucao") return { tipo: "devolucao" as const };
    if (decisao === "bloquear_externalizado")
      return { tipo: "bloqueado" as const };
    if (decisao === "gateway_nao_suportado")
      return { tipo: "gateway_nao_suportado" as const };
    if (decisao === "ja_finalizado") return { tipo: "ja_finalizado" as const };

    const pagamento =
      pedido.pagamentos.find((item) => item.status === "paid") ??
      pedido.pagamentos[0] ??
      null;
    const exigeReembolso = decisao === "cancelar_com_reembolso";
    const chaveIdempotencia = `cancelamento:${pedido.id}:reembolso:v1`;
    const agora = new Date();
    const [cancelamento] = await tx
      .insert(checkoutPedidoCancelamentosTable)
      .values({
        pedidoId: pedido.id,
        status: exigeReembolso ? "processando" : "concluido",
        motivo: dados.motivo,
        complementoMotivo: dados.complementoMotivo,
        solicitadoPorUsuarioId: sessao.usuario.id,
        solicitadoPorEmail: sessao.usuario.email,
        concluidoEm: exigeReembolso ? null : agora,
        gatewayReembolso: exigeReembolso ? pedido.gatewayPagamento : null,
        reembolsoStatus: exigeReembolso ? "processando" : "nao_necessario",
        chaveIdempotenciaReembolso: chaveIdempotencia,
      })
      .returning({ id: checkoutPedidoCancelamentosTable.id });

    await tx
      .update(checkoutPedidosTable)
      .set({ status: "canceled", updatedAt: agora })
      .where(eq(checkoutPedidosTable.id, pedido.id));
    if (!exigeReembolso) {
      await tx
        .update(checkoutPagamentosTable)
        .set({ status: "expired", updatedAt: agora })
        .where(
          and(
            eq(checkoutPagamentosTable.pedidoId, pedido.id),
            inArray(checkoutPagamentosTable.status, ["pending", "failed"]),
          ),
        );
    }
    await tx.insert(checkoutPedidoHistoricosTable).values({
      pedidoId: pedido.id,
      tipo: "cancelamento_solicitado",
      descricao: exigeReembolso
        ? "Cancelamento solicitado pelo cliente; reembolso iniciado."
        : "Pedido não pago cancelado pelo cliente.",
      origem: "cliente",
      statusAnterior: pedido.status,
      statusNovo: "canceled",
      metadata: { cancelamentoId: cancelamento.id, motivo: dados.motivo },
    });
    await processarEventoPedidoFidelidade(tx, pedido.id, "pedido_cancelado");
    return {
      tipo: exigeReembolso ? ("reembolsar" as const) : ("cancelado" as const),
      pedido,
      pagamento,
      chaveIdempotencia,
    };
  });

  if (preparacao.tipo === "nao_encontrado")
    return { sucesso: false, mensagem: "Pedido não encontrado." };
  if (preparacao.tipo === "devolucao")
    return {
      sucesso: false,
      estado: "devolucao",
      mensagem:
        "Este pedido já foi enviado. Use o atendimento para solicitar devolução ou exercer o direito de arrependimento.",
    };
  if (preparacao.tipo === "bloqueado")
    return {
      sucesso: false,
      estado: "bloqueado",
      mensagem:
        "O pedido já foi encaminhado ao fornecedor e não pode ser cancelado automaticamente. Fale com o atendimento.",
    };
  if (preparacao.tipo === "gateway_nao_suportado")
    return {
      sucesso: false,
      mensagem: "Este meio de pagamento exige atendimento para cancelamento.",
    };
  if (preparacao.tipo === "ja_finalizado") {
    revalidatePath(`/minha-conta/pedidos/${dados.pedidoId}`);
    return {
      sucesso: true,
      estado: "cancelado",
      mensagem: "Pedido cancelado.",
    };
  }
  if (preparacao.tipo === "cancelado") {
    // O estado interno já está seguro; indisponibilidade do PSP não desfaz o
    // cancelamento nem permite fulfillment. A ocorrência fica registrada.
    await cancelarCobrancaPendente({
      gateway: preparacao.pedido.gatewayPagamento,
      transactionId: preparacao.pagamento?.transactionId ?? null,
      pixTxid: preparacao.pagamento?.pixTxid ?? null,
    }).catch(async (erro) => {
      const mensagem = sanitizarErro(erro);
      await dbTransacional
        .update(checkoutPedidoCancelamentosTable)
        .set({
          erroOperacional: `Cobrança pendente: ${mensagem}`,
          updatedAt: new Date(),
        })
        .where(
          eq(checkoutPedidoCancelamentosTable.pedidoId, preparacao.pedido.id),
        );
    });
    revalidatePath(`/minha-conta/pedidos/${dados.pedidoId}`);
    return {
      sucesso: true,
      estado: "cancelado",
      mensagem: "Pedido cancelado.",
    };
  }
  if (preparacao.tipo === "existente") {
    return {
      sucesso: true,
      estado:
        preparacao.reembolsoStatus === "processando"
          ? "reembolso_processando"
          : "cancelado",
      mensagem:
        preparacao.reembolsoStatus === "processando"
          ? "Cancelamento já solicitado. O reembolso está em processamento."
          : "Este pedido já foi cancelado.",
    };
  }

  try {
    if (
      !preparacao.pagamento ||
      (preparacao.pedido.gatewayPagamento !== "stripe" &&
        preparacao.pedido.gatewayPagamento !== "efibank")
    )
      throw new Error("Pagamento confirmado não localizado.");
    const resultado = await reembolsarPagamento({
      gateway: preparacao.pedido.gatewayPagamento,
      transactionId: preparacao.pagamento.transactionId,
      pixTxid: preparacao.pagamento.pixTxid,
      valorEmCentavos: preparacao.pagamento.valorEmCentavos,
      chaveIdempotencia: preparacao.chaveIdempotencia,
      pedidoId: preparacao.pedido.id,
    });
    await dbTransacional.transaction(async (tx) => {
      const agora = new Date();
      await tx
        .update(checkoutPedidoCancelamentosTable)
        .set({
          status:
            resultado.status === "concluido" ? "concluido" : "processando",
          reembolsoStatus: resultado.status,
          reembolsoId: resultado.id,
          concluidoEm: resultado.status === "concluido" ? agora : null,
          updatedAt: agora,
        })
        .where(
          eq(checkoutPedidoCancelamentosTable.pedidoId, preparacao.pedido.id),
        );
      if (resultado.status === "concluido") {
        await tx
          .update(checkoutPedidosTable)
          .set({ status: "refunded", updatedAt: agora })
          .where(eq(checkoutPedidosTable.id, preparacao.pedido.id));
        await processarEventoPedidoFidelidade(
          tx,
          preparacao.pedido.id,
          "pedido_reembolsado",
        );
      }
      await tx
        .insert(checkoutPedidoHistoricosTable)
        .values({
          pedidoId: preparacao.pedido.id,
          tipo: "reembolso_atualizado",
          descricao:
            resultado.status === "concluido"
              ? "Reembolso concluído."
              : "Reembolso solicitado ao gateway e em processamento.",
          origem: "system",
          statusAnterior: "canceled",
          statusNovo:
            resultado.status === "concluido" ? "refunded" : "canceled",
          metadata: {
            gateway: preparacao.pedido.gatewayPagamento,
            reembolsoId: resultado.id,
          },
        });
    });
    revalidatePath(`/minha-conta/pedidos/${dados.pedidoId}`);
    return {
      sucesso: true,
      estado:
        resultado.status === "concluido"
          ? "cancelado"
          : "reembolso_processando",
      mensagem:
        resultado.status === "concluido"
          ? "Pedido cancelado e reembolso concluído."
          : "Pedido cancelado. O reembolso está em processamento.",
    };
  } catch (erro) {
    const mensagem = sanitizarErro(erro);
    await dbTransacional
      .update(checkoutPedidoCancelamentosTable)
      .set({
        status: "falhou",
        reembolsoStatus: "falhou",
        erroOperacional: mensagem,
        updatedAt: new Date(),
      })
      .where(
        eq(checkoutPedidoCancelamentosTable.pedidoId, preparacao.pedido.id),
      );
    console.error("[checkout:cancelamento:reembolso]", {
      pedidoId: preparacao.pedido.id,
      erro: mensagem,
    });
    revalidatePath(`/minha-conta/pedidos/${dados.pedidoId}`);
    return {
      sucesso: false,
      mensagem:
        "O pedido foi bloqueado para envio, mas o reembolso precisa de revisão. Nosso atendimento foi sinalizado.",
    };
  }
}
