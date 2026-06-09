import { and, eq, sql } from "drizzle-orm";

import {
  checkoutPagamentosTable,
  checkoutPedidosTable,
  cuponsPromocaoTable,
  usosCuponsPromocaoTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

export type StatusRegistroUsoCupomPromocao =
  | "registrado"
  | "ja_registrado"
  | "sem_cupom"
  | "pedido_nao_encontrado"
  | "pagamento_nao_confirmado"
  | "cupom_nao_encontrado";

export type ResultadoRegistrarUsoCupomPromocao = {
  registrado: boolean;
  status: StatusRegistroUsoCupomPromocao;
  pedidoId: string;
  cupomId?: string;
  codigoCupom?: string;
};

export type EntradaRegistrarUsoCupomPromocao = {
  pedidoId: string;
  pagamentoId?: string | null;
  clienteBanco?: ClienteBancoRegistroUsoCupomPromocao;
};

export type ClienteBancoRegistroUsoCupomPromocao = Pick<
  typeof dbTransacional,
  "query" | "insert" | "update"
>;

async function obterClienteBancoRegistroUsoCupom(
  clienteBanco?: ClienteBancoRegistroUsoCupomPromocao,
): Promise<ClienteBancoRegistroUsoCupomPromocao> {
  return clienteBanco ?? dbTransacional;
}

async function buscarPagamentoConfirmado({
  clienteBanco,
  pedidoId,
  pagamentoId,
}: {
  clienteBanco: ClienteBancoRegistroUsoCupomPromocao;
  pedidoId: string;
  pagamentoId?: string | null;
}) {
  if (pagamentoId) {
    return clienteBanco.query.checkoutPagamentosTable.findFirst({
      where: and(
        eq(checkoutPagamentosTable.id, pagamentoId),
        eq(checkoutPagamentosTable.pedidoId, pedidoId),
        eq(checkoutPagamentosTable.status, "paid"),
      ),
    });
  }

  return clienteBanco.query.checkoutPagamentosTable.findFirst({
    where: and(
      eq(checkoutPagamentosTable.pedidoId, pedidoId),
      eq(checkoutPagamentosTable.status, "paid"),
    ),
  });
}

export async function registrarUsoCupomPromocao({
  pedidoId,
  pagamentoId,
  clienteBanco,
}: EntradaRegistrarUsoCupomPromocao): Promise<ResultadoRegistrarUsoCupomPromocao> {
  const banco = await obterClienteBancoRegistroUsoCupom(clienteBanco);
  const pedido = await banco.query.checkoutPedidosTable.findFirst({
    where: eq(checkoutPedidosTable.id, pedidoId),
  });

  if (!pedido) {
    return {
      registrado: false,
      status: "pedido_nao_encontrado",
      pedidoId,
    };
  }

  if (pedido.pagamentoStatus !== "paid") {
    return {
      registrado: false,
      status: "pagamento_nao_confirmado",
      pedidoId,
    };
  }

  const codigoCupom = pedido.codigoCupomAplicado?.trim().toUpperCase();

  if (!codigoCupom || pedido.descontoCupomEmCentavos <= 0) {
    return {
      registrado: false,
      status: "sem_cupom",
      pedidoId,
    };
  }

  const pagamentoConfirmado = await buscarPagamentoConfirmado({
    clienteBanco: banco,
    pedidoId,
    pagamentoId,
  });

  if (!pagamentoConfirmado) {
    return {
      registrado: false,
      status: "pagamento_nao_confirmado",
      pedidoId,
      codigoCupom,
    };
  }

  const cupom = await banco.query.cuponsPromocaoTable.findFirst({
    where: eq(cuponsPromocaoTable.codigo, codigoCupom),
  });

  if (!cupom) {
    return {
      registrado: false,
      status: "cupom_nao_encontrado",
      pedidoId,
      codigoCupom,
    };
  }

  const usosInseridos = await banco
    .insert(usosCuponsPromocaoTable)
    .values({
      cupomPromocaoId: cupom.id,
      clienteId: pedido.clienteId,
      pedidoId: pedido.id,
      codigoCupom,
      valorDescontoEmCentavos: pedido.descontoCupomEmCentavos,
      usadoEm: pagamentoConfirmado.paidAt ?? new Date(),
    })
    .onConflictDoNothing({
      target: [
        usosCuponsPromocaoTable.pedidoId,
        usosCuponsPromocaoTable.cupomPromocaoId,
      ],
    })
    .returning({ id: usosCuponsPromocaoTable.id });

  if (usosInseridos.length === 0) {
    return {
      registrado: false,
      status: "ja_registrado",
      pedidoId,
      cupomId: cupom.id,
      codigoCupom,
    };
  }

  await banco
    .update(cuponsPromocaoTable)
    .set({
      totalUsos: sql`${cuponsPromocaoTable.totalUsos} + 1`,
      atualizadoEm: new Date(),
    })
    .where(eq(cuponsPromocaoTable.id, cupom.id));

  return {
    registrado: true,
    status: "registrado",
    pedidoId,
    cupomId: cupom.id,
    codigoCupom,
  };
}
