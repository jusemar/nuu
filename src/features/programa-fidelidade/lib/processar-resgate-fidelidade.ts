import { and, eq, sql } from "drizzle-orm";

import {
  carteirasFidelidadeTable,
  configuracoesProgramaFidelidadeTable,
  reservasFidelidadeTable,
  transacoesFidelidadeTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { VALOR_MINIMO_PAGAMENTO_APOS_FIDELIDADE_EM_CENTAVOS } from "../constants/resgate-fidelidade";
import {
  calcularCreditoPontos,
  calcularLimitesResgate,
} from "./calcular-resgate-fidelidade";

type TransacaoBanco = Parameters<
  Parameters<typeof dbTransacional.transaction>[0]
>[0];

function movimentoReserva(
  reserva: typeof reservasFidelidadeTable.$inferSelect,
  tipo:
    | "reserva_resgate"
    | "consumo_resgate"
    | "liberacao_resgate"
    | "devolucao_resgate",
  status: "reservada" | "consumida" | "liberada" | "devolvida",
  origemId?: string,
) {
  return {
    carteiraId: reserva.carteiraId,
    clienteId: reserva.clienteId,
    pedidoId: reserva.pedidoId,
    reservaId: reserva.id,
    transacaoOrigemId: origemId,
    tipo,
    status,
    referenciaIdempotencia: `${reserva.referenciaIdempotencia}:${tipo}`,
    origemRegra: "global" as const,
    configuracaoVersao: reserva.configuracaoVersao,
    taxaPontosPorReal: "0.0000",
    valorBrutoEmCentavos: String(reserva.creditoEmCentavos),
    descontoRateadoEmCentavos: "0",
    valorBaseEmCentavos: String(reserva.creditoEmCentavos),
    pontos: reserva.pontos,
    motivo: tipo,
    metadata: { operacao: tipo, modalidade: reserva.modalidade },
  };
}

export async function reservarPontosPedido({
  tx,
  pedidoId,
  checkoutClienteId,
  pontosSolicitados,
  baseElegivelEmCentavos,
  totalAntesJurosEmCentavos,
  referenciaIdempotencia,
}: {
  tx: TransacaoBanco;
  pedidoId: string;
  checkoutClienteId: string;
  pontosSolicitados: string;
  baseElegivelEmCentavos: number;
  totalAntesJurosEmCentavos: number;
  referenciaIdempotencia: string;
}) {
  const existente = await tx.query.reservasFidelidadeTable.findFirst({
    where: eq(reservasFidelidadeTable.pedidoId, pedidoId),
  });
  if (existente) return existente;

  const configuracao =
    await tx.query.configuracoesProgramaFidelidadeTable.findFirst({
      where: eq(configuracoesProgramaFidelidadeTable.id, "global"),
    });
  if (!configuracao?.ativo) throw new Error("PROGRAMA_FIDELIDADE_INATIVO");

  const carteira = await tx.query.carteirasFidelidadeTable.findFirst({
    where: eq(carteirasFidelidadeTable.clienteId, checkoutClienteId),
  });
  if (!carteira) throw new Error("SALDO_FIDELIDADE_INSUFICIENTE");

  const limites = calcularLimitesResgate({
    saldoDisponivel: carteira.pontosDisponiveis,
    pontosConversao: configuracao.pontosConversao,
    valorCreditoEmCentavos: configuracao.valorCreditoEmCentavos,
    baseElegivelEmCentavos,
    totalAntesJurosEmCentavos,
    valorMinimoPagamentoEmCentavos:
      VALOR_MINIMO_PAGAMENTO_APOS_FIDELIDADE_EM_CENTAVOS,
  });
  const creditoEmCentavos = calcularCreditoPontos({
    pontos: pontosSolicitados,
    pontosConversao: configuracao.pontosConversao,
    valorCreditoEmCentavos: configuracao.valorCreditoEmCentavos,
  });
  if (Number(pontosSolicitados) < Number(configuracao.minimoPontosResgate)) {
    throw new Error("MINIMO_RESGATE_NAO_ATINGIDO");
  }
  if (
    Number(pontosSolicitados) > Number(limites.maximoPontos) ||
    creditoEmCentavos <= 0 ||
    creditoEmCentavos > limites.limiteCreditoEmCentavos
  ) {
    throw new Error("LIMITE_RESGATE_EXCEDIDO");
  }

  const carteirasAtualizadas = await tx
    .update(carteirasFidelidadeTable)
    .set({
      pontosDisponiveis: sql`${carteirasFidelidadeTable.pontosDisponiveis} - ${pontosSolicitados}::numeric`,
      pontosReservados: sql`${carteirasFidelidadeTable.pontosReservados} + ${pontosSolicitados}::numeric`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(carteirasFidelidadeTable.id, carteira.id),
        sql`${carteirasFidelidadeTable.pontosDisponiveis} >= ${pontosSolicitados}::numeric`,
      ),
    )
    .returning({ id: carteirasFidelidadeTable.id });
  if (!carteirasAtualizadas.length)
    throw new Error("SALDO_FIDELIDADE_CONCORRENTE");

  const [reserva] = await tx
    .insert(reservasFidelidadeTable)
    .values({
      carteiraId: carteira.id,
      clienteId: checkoutClienteId,
      pedidoId,
      status: "reservada",
      pontos: pontosSolicitados,
      creditoEmCentavos,
      pontosConversao: configuracao.pontosConversao,
      valorCreditoConversaoEmCentavos: configuracao.valorCreditoEmCentavos,
      configuracaoVersao: configuracao.versao,
      baseElegivelEmCentavos,
      limiteAplicadoEmCentavos: limites.limiteCreditoEmCentavos,
      valorMinimoPagamentoEmCentavos:
        VALOR_MINIMO_PAGAMENTO_APOS_FIDELIDADE_EM_CENTAVOS,
      referenciaIdempotencia,
    })
    .returning();
  if (!reserva) throw new Error("RESERVA_FIDELIDADE_NAO_CRIADA");
  await tx
    .insert(transacoesFidelidadeTable)
    .values(movimentoReserva(reserva, "reserva_resgate", "reservada"));
  return reserva;
}

/** Reserva um produto por pontos, sem transformar o custo em desconto monetário. */
export async function reservarPontosRecompensaPedido({
  tx,
  pedidoId,
  checkoutClienteId,
  custoPontos,
}: {
  tx: TransacaoBanco;
  pedidoId: string;
  checkoutClienteId: string;
  custoPontos: number;
}) {
  if (!Number.isSafeInteger(custoPontos) || custoPontos <= 0) {
    throw new Error("CUSTO_RECOMPENSA_INVALIDO");
  }
  const existente = await tx.query.reservasFidelidadeTable.findFirst({
    where: eq(reservasFidelidadeTable.pedidoId, pedidoId),
  });
  if (existente) {
    if (existente.modalidade !== "recompensa") throw new Error("RESERVA_MODALIDADE_INCOMPATIVEL");
    return existente;
  }
  const configuracao = await tx.query.configuracoesProgramaFidelidadeTable.findFirst({
    where: eq(configuracoesProgramaFidelidadeTable.id, "global"),
  });
  if (!configuracao?.ativo) throw new Error("PROGRAMA_FIDELIDADE_INATIVO");
  const carteira = await tx.query.carteirasFidelidadeTable.findFirst({
    where: eq(carteirasFidelidadeTable.clienteId, checkoutClienteId),
  });
  if (!carteira) throw new Error("SALDO_FIDELIDADE_INSUFICIENTE");
  const pontos = String(custoPontos);
  const [debitada] = await tx.update(carteirasFidelidadeTable).set({
    pontosDisponiveis: sql`${carteirasFidelidadeTable.pontosDisponiveis} - ${pontos}::numeric`,
    pontosReservados: sql`${carteirasFidelidadeTable.pontosReservados} + ${pontos}::numeric`,
    updatedAt: new Date(),
  }).where(and(
    eq(carteirasFidelidadeTable.id, carteira.id),
    sql`${carteirasFidelidadeTable.pontosDisponiveis} >= ${pontos}::numeric`,
  )).returning({ id: carteirasFidelidadeTable.id });
  if (!debitada) throw new Error("SALDO_FIDELIDADE_CONCORRENTE");
  const [reserva] = await tx.insert(reservasFidelidadeTable).values({
    carteiraId: carteira.id,
    clienteId: checkoutClienteId,
    pedidoId,
    modalidade: "recompensa",
    status: "reservada",
    pontos,
    creditoEmCentavos: 0,
    pontosConversao: configuracao.pontosConversao,
    valorCreditoConversaoEmCentavos: configuracao.valorCreditoEmCentavos,
    configuracaoVersao: configuracao.versao,
    baseElegivelEmCentavos: 0,
    limiteAplicadoEmCentavos: 0,
    valorMinimoPagamentoEmCentavos: 0,
    referenciaIdempotencia: `pedido:${pedidoId}:recompensa`,
  }).returning();
  if (!reserva) throw new Error("RESERVA_FIDELIDADE_NAO_CRIADA");
  await tx.insert(transacoesFidelidadeTable)
    .values(movimentoReserva(reserva, "reserva_resgate", "reservada"));
  return reserva;
}

export async function processarReservaPedido(
  tx: TransacaoBanco,
  pedidoId: string,
  operacao: "consumir" | "liberar" | "devolver",
  motivo: string,
) {
  const reserva = await tx.query.reservasFidelidadeTable.findFirst({
    where: eq(reservasFidelidadeTable.pedidoId, pedidoId),
  });
  if (!reserva) return { status: "sem_reserva" as const };

  const esperado = operacao === "devolver" ? "consumida" : "reservada";
  if (reserva.status !== esperado) {
    return { status: `ja_${reserva.status}` as const };
  }
  const novoStatus =
    operacao === "consumir"
      ? "consumida"
      : operacao === "liberar"
        ? "liberada"
        : "devolvida";
  const agora = new Date();
  const atualizadas = await tx
    .update(reservasFidelidadeTable)
    .set({
      status: novoStatus,
      motivoFinalizacao: motivo,
      ...(operacao === "consumir" ? { consumidaEm: agora } : {}),
      ...(operacao === "liberar" ? { liberadaEm: agora } : {}),
      ...(operacao === "devolver" ? { devolvidaEm: agora } : {}),
      updatedAt: agora,
    })
    .where(
      and(
        eq(reservasFidelidadeTable.id, reserva.id),
        eq(reservasFidelidadeTable.status, esperado),
      ),
    )
    .returning({ id: reservasFidelidadeTable.id });
  if (!atualizadas.length) return { status: "concorrencia" as const };

  await tx
    .update(carteirasFidelidadeTable)
    .set({
      ...(operacao === "consumir"
        ? {
            pontosReservados: sql`${carteirasFidelidadeTable.pontosReservados} - ${reserva.pontos}::numeric`,
            pontosUtilizados: sql`${carteirasFidelidadeTable.pontosUtilizados} + ${reserva.pontos}::numeric`,
          }
        : operacao === "liberar"
          ? {
              pontosReservados: sql`${carteirasFidelidadeTable.pontosReservados} - ${reserva.pontos}::numeric`,
              pontosDisponiveis: sql`${carteirasFidelidadeTable.pontosDisponiveis} + ${reserva.pontos}::numeric`,
            }
          : {
              pontosUtilizados: sql`${carteirasFidelidadeTable.pontosUtilizados} - ${reserva.pontos}::numeric`,
              pontosDisponiveis: sql`${carteirasFidelidadeTable.pontosDisponiveis} + ${reserva.pontos}::numeric`,
            }),
      updatedAt: agora,
    })
    .where(eq(carteirasFidelidadeTable.id, reserva.carteiraId));

  const tipo =
    operacao === "consumir"
      ? "consumo_resgate"
      : operacao === "liberar"
        ? "liberacao_resgate"
        : "devolucao_resgate";
  const origem = await tx.query.transacoesFidelidadeTable.findFirst({
    where: and(
      eq(transacoesFidelidadeTable.reservaId, reserva.id),
      eq(transacoesFidelidadeTable.tipo, "reserva_resgate"),
    ),
  });
  await tx
    .insert(transacoesFidelidadeTable)
    .values(movimentoReserva(reserva, tipo, novoStatus, origem?.id))
    .onConflictDoNothing({
      target: transacoesFidelidadeTable.referenciaIdempotencia,
    });
  return { status: novoStatus };
}

/**
 * Reobtém os pontos históricos de um pedido pago tardiamente. Não recalcula o
 * desconto já cobrado: apenas volta a reservar exatamente os pontos originais.
 * O chamador usa savepoint junto da realocação de estoque para tudo-ou-nada.
 */
export async function reobterReservaLiberadaPedido(
  tx: TransacaoBanco,
  pedidoId: string,
): Promise<"sem_reserva" | "pronta" | "indisponivel"> {
  const [reserva] = await tx.select().from(reservasFidelidadeTable)
    .where(eq(reservasFidelidadeTable.pedidoId, pedidoId));
  if (!reserva) return "sem_reserva";
  if (reserva.status === "reservada") return "pronta";
  if (reserva.status !== "liberada") return "indisponivel";

  const [carteira] = await tx.update(carteirasFidelidadeTable)
    .set({
      pontosDisponiveis: sql`${carteirasFidelidadeTable.pontosDisponiveis} - ${reserva.pontos}::numeric`,
      pontosReservados: sql`${carteirasFidelidadeTable.pontosReservados} + ${reserva.pontos}::numeric`,
      updatedAt: new Date(),
    })
    .where(and(
      eq(carteirasFidelidadeTable.id, reserva.carteiraId),
      sql`${carteirasFidelidadeTable.pontosDisponiveis} >= ${reserva.pontos}::numeric`,
    ))
    .returning({ id: carteirasFidelidadeTable.id });
  if (!carteira) return "indisponivel";

  const [atualizada] = await tx.update(reservasFidelidadeTable)
    .set({ status: "reservada", liberadaEm: null, motivoFinalizacao: null, updatedAt: new Date() })
    .where(and(
      eq(reservasFidelidadeTable.id, reserva.id),
      eq(reservasFidelidadeTable.status, "liberada"),
    ))
    .returning({ id: reservasFidelidadeTable.id });
  if (!atualizada) return "indisponivel";

  await tx.insert(transacoesFidelidadeTable).values({
    ...movimentoReserva(reserva, "reserva_resgate", "reservada"),
    referenciaIdempotencia: `${reserva.referenciaIdempotencia}:reobtencao_tardia`,
    motivo: "reobtencao_apos_pagamento_tardio",
    metadata: { operacao: "reobtencao_tardia" },
  });
  return "pronta";
}
