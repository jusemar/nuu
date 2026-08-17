import { and, eq, inArray, sql } from "drizzle-orm";

import {
  carteirasFidelidadeTable,
  checkoutPedidoItensTable,
  checkoutPedidosTable,
  configuracoesProgramaFidelidadeTable,
  processamentosPedidosFidelidadeTable,
  regrasCategoriasProgramaFidelidadeTable,
  transacoesFidelidadeTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { calcularPontosItensPedido } from "./calcular-pontos-pedido";
import { processarReservaPedido } from "./processar-resgate-fidelidade";

type TransacaoBanco = Parameters<
  Parameters<typeof dbTransacional.transaction>[0]
>[0];

export type EventoFidelidadePedido =
  | "pagamento_confirmado"
  | "pedido_entregue"
  | "pedido_cancelado"
  | "pagamento_estornado"
  | "pedido_reembolsado";

function somarPontos(valores: string[]) {
  const unidades = valores.reduce((total, valor) => {
    const [inteira = "0", decimal = ""] = valor.split(".");
    return (
      total + BigInt(inteira) * BigInt(10_000) + BigInt(decimal.padEnd(4, "0"))
    );
  }, BigInt(0));
  return `${unidades / BigInt(10_000)}.${String(unidades % BigInt(10_000)).padStart(4, "0")}`;
}

type TransacaoFidelidade = typeof transacoesFidelidadeTable.$inferSelect;

function criarMovimentoDerivado(
  credito: TransacaoFidelidade,
  dados: {
    tipo: "liberacao" | "reversao_pendente" | "reversao_disponivel";
    status: "disponivel" | "revertido";
    motivo: string;
  },
): typeof transacoesFidelidadeTable.$inferInsert {
  return {
    carteiraId: credito.carteiraId,
    clienteId: credito.clienteId,
    pedidoId: credito.pedidoId,
    pedidoItemId: credito.pedidoItemId,
    transacaoOrigemId: credito.id,
    categoriaId: credito.categoriaId,
    tipo: dados.tipo,
    status: dados.status,
    referenciaIdempotencia: `${credito.referenciaIdempotencia}:${dados.tipo}`,
    origemRegra: credito.origemRegra,
    configuracaoVersao: credito.configuracaoVersao,
    taxaPontosPorReal: credito.taxaPontosPorReal,
    valorBrutoEmCentavos: credito.valorBrutoEmCentavos,
    descontoRateadoEmCentavos: credito.descontoRateadoEmCentavos,
    valorBaseEmCentavos: credito.valorBaseEmCentavos,
    pontos: credito.pontos,
    motivo: dados.motivo,
    metadata: credito.metadata,
  };
}

async function registrarNaoElegivel(
  tx: TransacaoBanco,
  pedido: { id: string; clienteId: string },
  motivo: string,
) {
  await tx
    .insert(processamentosPedidosFidelidadeTable)
    .values({
      pedidoId: pedido.id,
      clienteId: pedido.clienteId,
      situacao: "nao_elegivel",
      motivo,
    })
    .onConflictDoNothing({
      target: processamentosPedidosFidelidadeTable.pedidoId,
    });
  console.warn("[programa-fidelidade:pedido-nao-elegivel]", {
    pedidoId: pedido.id,
    motivo,
  });
}

async function gerarPontosPendentes(tx: TransacaoBanco, pedidoId: string) {
  const [pedido] = await tx
    .select({
      id: checkoutPedidosTable.id,
      clienteId: checkoutPedidosTable.clienteId,
      pagamentoStatus: checkoutPedidosTable.pagamentoStatus,
      descontoCupomEmCentavos: checkoutPedidosTable.descontoCupomEmCentavos,
    })
    .from(checkoutPedidosTable)
    .where(eq(checkoutPedidosTable.id, pedidoId))
    .limit(1);
  if (!pedido || pedido.pagamentoStatus !== "paid") return;

  const [jaProcessado] = await tx
    .select({ id: processamentosPedidosFidelidadeTable.id })
    .from(processamentosPedidosFidelidadeTable)
    .where(eq(processamentosPedidosFidelidadeTable.pedidoId, pedidoId))
    .limit(1);
  if (jaProcessado) return;

  const [configuracao] = await tx
    .select()
    .from(configuracoesProgramaFidelidadeTable)
    .where(eq(configuracoesProgramaFidelidadeTable.id, "global"))
    .limit(1);
  if (!configuracao?.ativo) {
    await registrarNaoElegivel(
      tx,
      pedido,
      "programa_inativo_ou_nao_configurado",
    );
    return;
  }

  const itens = await tx
    .select({
      id: checkoutPedidoItensTable.id,
      categoriaId: checkoutPedidoItensTable.categoriaId,
      valorBrutoEmCentavos: checkoutPedidoItensTable.totalEmCentavos,
      creditoFidelidadeRateadoEmCentavos:
        checkoutPedidoItensTable.creditoFidelidadeRateadoEmCentavos,
    })
    .from(checkoutPedidoItensTable)
    .where(eq(checkoutPedidoItensTable.pedidoId, pedidoId));
  if (itens.length === 0 || itens.some((item) => item.categoriaId === null)) {
    await registrarNaoElegivel(tx, pedido, "snapshot_categoria_ausente");
    return;
  }

  const categoriasIds = [...new Set(itens.map((item) => item.categoriaId!))];
  const regras = await tx
    .select()
    .from(regrasCategoriasProgramaFidelidadeTable)
    .where(
      inArray(
        regrasCategoriasProgramaFidelidadeTable.categoriaId,
        categoriasIds,
      ),
    );
  const regraPorCategoria = new Map(
    regras.map((regra) => [regra.categoriaId, regra]),
  );
  const calculos = calcularPontosItensPedido({
    descontoCupomEmCentavos: pedido.descontoCupomEmCentavos,
    itens: itens.map((item) => {
      const regra = regraPorCategoria.get(item.categoriaId!);
      return {
        id: item.id,
        categoriaId: item.categoriaId!,
        valorBrutoEmCentavos: item.valorBrutoEmCentavos,
        ativa: regra?.ativa ?? true,
        origemRegra: regra?.pontosPorReal ? "personalizada" : "global",
        taxaPontosPorReal: regra?.pontosPorReal ?? configuracao.pontosPorReal,
        creditoFidelidadeRateadoEmCentavos:
          item.creditoFidelidadeRateadoEmCentavos,
      };
    }),
  });

  const [processamento] = await tx
    .insert(processamentosPedidosFidelidadeTable)
    .values({
      pedidoId,
      clienteId: pedido.clienteId,
      situacao: calculos.length ? "pendente" : "nao_elegivel",
      motivo: calculos.length ? null : "nenhum_item_elegivel",
    })
    .onConflictDoNothing({
      target: processamentosPedidosFidelidadeTable.pedidoId,
    })
    .returning({ id: processamentosPedidosFidelidadeTable.id });
  if (!processamento || calculos.length === 0) return;

  const [carteira] = await tx
    .insert(carteirasFidelidadeTable)
    .values({ clienteId: pedido.clienteId })
    .onConflictDoUpdate({
      target: carteirasFidelidadeTable.clienteId,
      set: { updatedAt: new Date() },
    })
    .returning({ id: carteirasFidelidadeTable.id });
  if (!carteira) throw new Error("CARTEIRA_FIDELIDADE_NAO_CRIADA");

  await tx.insert(transacoesFidelidadeTable).values(
    calculos.map((calculo) => ({
      carteiraId: carteira.id,
      clienteId: pedido.clienteId,
      pedidoId,
      pedidoItemId: calculo.id,
      categoriaId: calculo.categoriaId,
      tipo: "credito_pendente" as const,
      status: "pendente" as const,
      referenciaIdempotencia: `pedido:${pedidoId}:item:${calculo.id}:credito`,
      origemRegra: calculo.origemRegra,
      configuracaoVersao: configuracao.versao,
      taxaPontosPorReal: calculo.taxaPontosPorReal,
      valorBrutoEmCentavos: String(calculo.valorBrutoEmCentavos),
      descontoRateadoEmCentavos: String(calculo.descontoRateadoEmCentavos),
      valorBaseEmCentavos: String(calculo.valorBaseEmCentavos),
      pontos: calculo.pontos,
      metadata: { desconto: "cupom_rateado_maiores_sobras" },
    })),
  );
  const total = somarPontos(calculos.map((calculo) => calculo.pontos));
  await tx
    .update(carteirasFidelidadeTable)
    .set({
      pontosPendentes: sql`${carteirasFidelidadeTable.pontosPendentes} + ${total}::numeric`,
      totalAcumuladoHistorico: sql`${carteirasFidelidadeTable.totalAcumuladoHistorico} + ${total}::numeric`,
      updatedAt: new Date(),
    })
    .where(eq(carteirasFidelidadeTable.id, carteira.id));
}

async function liberarPontos(tx: TransacaoBanco, pedidoId: string) {
  await gerarPontosPendentes(tx, pedidoId);
  const [processamento] = await tx
    .update(processamentosPedidosFidelidadeTable)
    .set({ situacao: "disponivel", updatedAt: new Date() })
    .where(
      and(
        eq(processamentosPedidosFidelidadeTable.pedidoId, pedidoId),
        eq(processamentosPedidosFidelidadeTable.situacao, "pendente"),
      ),
    )
    .returning({ clienteId: processamentosPedidosFidelidadeTable.clienteId });
  if (!processamento) return;

  const creditos = await tx
    .select()
    .from(transacoesFidelidadeTable)
    .where(
      and(
        eq(transacoesFidelidadeTable.pedidoId, pedidoId),
        eq(transacoesFidelidadeTable.tipo, "credito_pendente"),
      ),
    );
  if (!creditos.length) return;
  await tx.insert(transacoesFidelidadeTable).values(
    creditos.map((credito) =>
      criarMovimentoDerivado(credito, {
        tipo: "liberacao",
        status: "disponivel",
        motivo: "pedido_entregue",
      }),
    ),
  );
  const total = somarPontos(creditos.map((credito) => credito.pontos));
  await tx
    .update(carteirasFidelidadeTable)
    .set({
      pontosPendentes: sql`${carteirasFidelidadeTable.pontosPendentes} - ${total}::numeric`,
      pontosDisponiveis: sql`${carteirasFidelidadeTable.pontosDisponiveis} + ${total}::numeric`,
      updatedAt: new Date(),
    })
    .where(eq(carteirasFidelidadeTable.clienteId, processamento.clienteId));
}

async function reverterPontos(
  tx: TransacaoBanco,
  pedidoId: string,
  motivo: "pedido_cancelado" | "pagamento_estornado" | "pedido_reembolsado",
) {
  const [processamentoAtual] = await tx
    .select()
    .from(processamentosPedidosFidelidadeTable)
    .where(eq(processamentosPedidosFidelidadeTable.pedidoId, pedidoId))
    .limit(1);
  if (
    !processamentoAtual ||
    !["pendente", "disponivel"].includes(processamentoAtual.situacao)
  )
    return;
  const situacaoAnterior = processamentoAtual.situacao as
    | "pendente"
    | "disponivel";
  const [revertido] = await tx
    .update(processamentosPedidosFidelidadeTable)
    .set({ situacao: "revertido", motivo, updatedAt: new Date() })
    .where(
      and(
        eq(processamentosPedidosFidelidadeTable.id, processamentoAtual.id),
        eq(processamentosPedidosFidelidadeTable.situacao, situacaoAnterior),
      ),
    )
    .returning({ id: processamentosPedidosFidelidadeTable.id });
  if (!revertido) return;

  const creditos = await tx
    .select()
    .from(transacoesFidelidadeTable)
    .where(
      and(
        eq(transacoesFidelidadeTable.pedidoId, pedidoId),
        eq(transacoesFidelidadeTable.tipo, "credito_pendente"),
      ),
    );
  if (!creditos.length) return;
  const tipo: "reversao_pendente" | "reversao_disponivel" =
    situacaoAnterior === "pendente"
      ? "reversao_pendente"
      : "reversao_disponivel";
  await tx.insert(transacoesFidelidadeTable).values(
    creditos.map((credito) =>
      criarMovimentoDerivado(credito, {
        tipo,
        status: "revertido",
        motivo,
      }),
    ),
  );
  const total = somarPontos(creditos.map((credito) => credito.pontos));
  await tx
    .update(carteirasFidelidadeTable)
    .set({
      ...(situacaoAnterior === "pendente"
        ? {
            pontosPendentes: sql`${carteirasFidelidadeTable.pontosPendentes} - ${total}::numeric`,
          }
        : {
            pontosDisponiveis: sql`${carteirasFidelidadeTable.pontosDisponiveis} - ${total}::numeric`,
          }),
      pontosRevertidos: sql`${carteirasFidelidadeTable.pontosRevertidos} + ${total}::numeric`,
      updatedAt: new Date(),
    })
    .where(
      eq(carteirasFidelidadeTable.clienteId, processamentoAtual.clienteId),
    );
}

export async function processarEventoPedidoFidelidade(
  tx: TransacaoBanco,
  pedidoId: string,
  evento: EventoFidelidadePedido,
) {
  const [pedido] = await tx
    .select({
      status: checkoutPedidosTable.status,
      pagamentoStatus: checkoutPedidosTable.pagamentoStatus,
    })
    .from(checkoutPedidosTable)
    .where(eq(checkoutPedidosTable.id, pedidoId))
    .limit(1);
  if (!pedido) return;

  if (evento === "pagamento_confirmado") {
    if (pedido.pagamentoStatus !== "paid") return;
    const resgate = await processarReservaPedido(
      tx,
      pedidoId,
      "consumir",
      "pagamento_confirmado",
    );
    if (resgate.status === "ja_liberada") {
      console.error("[programa-fidelidade:pagamento-tardio-reserva-liberada]", {
        pedidoId,
      });
      return;
    }
    return gerarPontosPendentes(tx, pedidoId);
  }
  if (evento === "pedido_entregue")
    return pedido.status === "delivered"
      ? liberarPontos(tx, pedidoId)
      : undefined;
  if (evento === "pedido_cancelado" && pedido.status !== "canceled") return;
  if (evento === "pagamento_estornado" && pedido.pagamentoStatus !== "pending")
    return;
  if (evento === "pedido_reembolsado" && pedido.status !== "refunded") return;
  const liberacao = await processarReservaPedido(
    tx,
    pedidoId,
    "liberar",
    evento,
  );
  if (liberacao.status === "ja_consumida") {
    await processarReservaPedido(tx, pedidoId, "devolver", evento);
  }
  return reverterPontos(tx, pedidoId, evento);
}
