import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { and, eq, inArray, sql } from "drizzle-orm";

import {
  carteirasFidelidadeTable,
  categoryTable,
  checkoutClientesTable,
  checkoutEnderecosTable,
  checkoutPedidoItensTable,
  checkoutPedidosTable,
  configuracoesProgramaFidelidadeTable,
  processamentosPedidosFidelidadeTable,
  regrasCategoriasProgramaFidelidadeTable,
  reservasFidelidadeTable,
  transacoesFidelidadeTable,
} from "@/db/schema";
import {
  dbTransacional,
  encerrarBancoTransacionalIntegracao,
} from "@/db/transaction";

import {
  calcularCreditoPontos,
  calcularLimitesResgate,
  ratearCreditoFidelidadeEntreItens,
} from "./calcular-resgate-fidelidade";
import { processarEventoPedidoFidelidade } from "./processar-evento-pedido-fidelidade";
import {
  processarReservaPedido,
  reservarPontosPedido,
} from "./processar-resgate-fidelidade";

const sufixo = randomUUID();
const clienteId = randomUUID();
const enderecoId = randomUUID();
const carteiraId = randomUUID();
const categoriaId = randomUUID();
const pedidosCriados: string[] = [];
let configuracaoCriadaPeloTeste = false;

function pontosFormatados(valor: number) {
  return valor.toFixed(4);
}

function numero(valor: string | null | undefined) {
  return Number(valor ?? 0);
}

function registrar(nome: string) {
  console.log(`[resgate-integracao] OK: ${nome}`);
}

async function buscarCarteira() {
  const [carteira] = await dbTransacional
    .select()
    .from(carteirasFidelidadeTable)
    .where(eq(carteirasFidelidadeTable.id, carteiraId));
  assert.ok(carteira);
  return carteira;
}

async function contarMovimentosReserva(
  reservaId: string,
  tipo: typeof transacoesFidelidadeTable.$inferSelect.tipo,
) {
  const [resultado] = await dbTransacional
    .select({ total: sql<number>`count(*)::int` })
    .from(transacoesFidelidadeTable)
    .where(
      and(
        eq(transacoesFidelidadeTable.reservaId, reservaId),
        eq(transacoesFidelidadeTable.tipo, tipo),
      ),
    );
  return resultado?.total ?? 0;
}

async function criarPedido({
  descontoCupomEmCentavos = 0,
  creditoFidelidadeEmCentavos = 0,
  pontosResgatados = null,
  baseElegivelEmCentavos = 10_000,
  freteEmCentavos = 500,
  jurosEmCentavos = 0,
}: {
  descontoCupomEmCentavos?: number;
  creditoFidelidadeEmCentavos?: number;
  pontosResgatados?: string | null;
  baseElegivelEmCentavos?: number;
  freteEmCentavos?: number;
  jurosEmCentavos?: number;
}) {
  const pedidoId = randomUUID();
  pedidosCriados.push(pedidoId);
  const [pedido] = await dbTransacional
    .insert(checkoutPedidosTable)
    .values({
      id: pedidoId,
      numeroPedido: `#IT-5B-${randomUUID()}`,
      clienteId,
      enderecoId,
      status: "pending",
      subtotalEmCentavos: baseElegivelEmCentavos + descontoCupomEmCentavos,
      freteEmCentavos,
      descontoEmCentavos: descontoCupomEmCentavos,
      descontoPromocionalEmCentavos: 0,
      descontoCupomEmCentavos,
      economiaTotalEmCentavos:
        descontoCupomEmCentavos + creditoFidelidadeEmCentavos,
      totalEmCentavos:
        baseElegivelEmCentavos -
        creditoFidelidadeEmCentavos +
        freteEmCentavos +
        jurosEmCentavos,
      codigoCupomAplicado:
        descontoCupomEmCentavos > 0 ? `IT5B-${sufixo}` : null,
      pontosResgatados,
      creditoFidelidadeEmCentavos,
      baseElegivelFidelidadeEmCentavos: pontosResgatados
        ? baseElegivelEmCentavos
        : null,
      gatewayPagamento: "stripe",
      pagamentoStatus: "pending",
    })
    .returning();
  assert.ok(pedido);
  return pedido;
}

async function reservar({
  pedidoId,
  pontos,
  baseElegivelEmCentavos,
  creditoEmCentavos,
  referencia,
}: {
  pedidoId: string;
  pontos: string;
  baseElegivelEmCentavos: number;
  creditoEmCentavos: number;
  referencia: string;
}) {
  return dbTransacional.transaction(async (tx) => {
    const reserva = await reservarPontosPedido({
      tx,
      pedidoId,
      checkoutClienteId: clienteId,
      pontosSolicitados: pontos,
      baseElegivelEmCentavos,
      totalAntesJurosEmCentavos: baseElegivelEmCentavos + 500,
      referenciaIdempotencia: referencia,
    });
    await tx
      .update(checkoutPedidosTable)
      .set({
        reservaFidelidadeId: reserva.id,
        pontosConversaoFidelidade: reserva.pontosConversao,
        valorCreditoConversaoEmCentavos:
          reserva.valorCreditoConversaoEmCentavos,
        configuracaoFidelidadeVersao: reserva.configuracaoVersao,
        limiteFidelidadeAplicadoEmCentavos: reserva.limiteAplicadoEmCentavos,
        valorMinimoPagamentoEmCentavos: reserva.valorMinimoPagamentoEmCentavos,
      })
      .where(eq(checkoutPedidosTable.id, pedidoId));
    assert.equal(reserva.creditoEmCentavos, creditoEmCentavos);
    return reserva;
  });
}

async function validarEstrutura() {
  const colunas = await dbTransacional.execute<{ column_name: string }>(sql`
    select column_name
      from information_schema.columns
     where table_schema = 'public'
       and table_name in (
         'programa_fidelidade_reservas',
         'programa_fidelidade_carteiras',
         'programa_fidelidade_transacoes',
         'checkout_pedidos',
         'checkout_pedido_itens'
       )
  `);
  const nomesColunas = new Set(colunas.rows.map((linha) => linha.column_name));
  for (const coluna of [
    "pontos_reservados",
    "reserva_id",
    "pontos_resgatados",
    "credito_fidelidade_em_centavos",
    "reserva_fidelidade_id",
    "credito_fidelidade_rateado_em_centavos",
  ]) {
    assert.ok(nomesColunas.has(coluna), `coluna ausente: ${coluna}`);
  }

  const estrutura = await dbTransacional.execute<{
    fks: number;
    checks: number;
    unicos: number;
  }>(sql`
    select
      count(*) filter (where c.contype = 'f')::int as fks,
      count(*) filter (where c.contype = 'c')::int as checks,
      count(*) filter (where c.contype = 'u')::int as unicos
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
     where t.relname = 'programa_fidelidade_reservas'
  `);
  assert.equal(estrutura.rows[0]?.fks, 3);
  assert.equal(estrutura.rows[0]?.checks, 2);

  const indices = await dbTransacional.execute<{ indexname: string }>(sql`
    select indexname
      from pg_indexes
     where schemaname = 'public'
       and tablename = 'programa_fidelidade_reservas'
  `);
  const nomesIndices = new Set(indices.rows.map((linha) => linha.indexname));
  assert.ok(nomesIndices.has("programa_fidelidade_reserva_pedido_unique"));
  assert.ok(nomesIndices.has("programa_fidelidade_reserva_referencia_unique"));
  assert.ok(nomesIndices.has("programa_fidelidade_reserva_cliente_status_idx"));
  registrar("tabelas, colunas, FKs, checks e índices da migration 0027");
}

async function limparFixtures() {
  if (pedidosCriados.length > 0) {
    await dbTransacional
      .delete(transacoesFidelidadeTable)
      .where(inArray(transacoesFidelidadeTable.pedidoId, pedidosCriados));
    await dbTransacional
      .delete(processamentosPedidosFidelidadeTable)
      .where(
        inArray(processamentosPedidosFidelidadeTable.pedidoId, pedidosCriados),
      );
    await dbTransacional
      .delete(reservasFidelidadeTable)
      .where(inArray(reservasFidelidadeTable.pedidoId, pedidosCriados));
    await dbTransacional
      .delete(checkoutPedidosTable)
      .where(inArray(checkoutPedidosTable.id, pedidosCriados));
  }
  await dbTransacional
    .delete(carteirasFidelidadeTable)
    .where(eq(carteirasFidelidadeTable.id, carteiraId));
  await dbTransacional
    .delete(checkoutEnderecosTable)
    .where(eq(checkoutEnderecosTable.id, enderecoId));
  await dbTransacional
    .delete(checkoutClientesTable)
    .where(eq(checkoutClientesTable.id, clienteId));
  await dbTransacional
    .delete(categoryTable)
    .where(eq(categoryTable.id, categoriaId));
  if (configuracaoCriadaPeloTeste) {
    await dbTransacional
      .delete(configuracoesProgramaFidelidadeTable)
      .where(eq(configuracoesProgramaFidelidadeTable.id, "global"));
  }
}

async function executar() {
  await validarEstrutura();

  let [configuracao] = await dbTransacional
    .select()
    .from(configuracoesProgramaFidelidadeTable)
    .where(eq(configuracoesProgramaFidelidadeTable.id, "global"))
    .limit(1);
  if (!configuracao) {
    [configuracao] = await dbTransacional
      .insert(configuracoesProgramaFidelidadeTable)
      .values({
        id: "global",
        ativo: true,
        nomePublico: "Programa de Fidelidade — integração 5B",
        pontosPorReal: "1.0000",
        pontosConversao: "100.0000",
        valorCreditoEmCentavos: 1_000,
        minimoPontosResgate: "100.0000",
        mesesValidade: 12,
        versao: 1,
      })
      .onConflictDoNothing()
      .returning();
    configuracaoCriadaPeloTeste = Boolean(configuracao);
    if (!configuracao) {
      [configuracao] = await dbTransacional
        .select()
        .from(configuracoesProgramaFidelidadeTable)
        .where(eq(configuracoesProgramaFidelidadeTable.id, "global"))
        .limit(1);
    }
  }
  assert.ok(configuracao, "não foi possível preparar a configuração global");
  assert.equal(
    configuracao.ativo,
    true,
    "programa precisa estar ativo no desenvolvimento",
  );

  const pontos = pontosFormatados(
    Math.max(
      numero(configuracao.minimoPontosResgate),
      numero(configuracao.pontosConversao),
    ),
  );
  const creditoEmCentavos = calcularCreditoPontos({
    pontos,
    pontosConversao: configuracao.pontosConversao,
    valorCreditoEmCentavos: configuracao.valorCreditoEmCentavos,
  });
  assert.ok(creditoEmCentavos > 0);
  const baseElegivelEmCentavos = creditoEmCentavos + 20_333;
  assert.ok(Number.isSafeInteger(baseElegivelEmCentavos));
  const saldoInicial = pontosFormatados(numero(pontos) * 20);

  await dbTransacional.insert(categoryTable).values({
    id: categoriaId,
    name: `Categoria integração 5B ${sufixo}`,
    slug: `categoria-integracao-5b-${sufixo}`,
  });
  await dbTransacional
    .insert(regrasCategoriasProgramaFidelidadeTable)
    .values({ categoriaId, ativa: true });
  await dbTransacional.insert(checkoutClientesTable).values({
    id: clienteId,
    nome: "Cliente Integração 5B",
    email: `integracao-5b-${sufixo}@example.invalid`,
    telefone: "11999999999",
    documento: randomUUID(),
  });
  await dbTransacional.insert(checkoutEnderecosTable).values({
    id: enderecoId,
    clienteId,
    cep: "00000000",
    rua: "Rua de teste",
    numero: "1",
    bairro: "Teste",
    cidade: "Teste",
    estado: "SP",
  });
  await dbTransacional.insert(carteirasFidelidadeTable).values({
    id: carteiraId,
    clienteId,
    pontosDisponiveis: saldoInicial,
  });
  const carteiraAntes = await buscarCarteira();
  assert.equal(carteiraAntes.pontosDisponiveis, saldoInicial);
  assert.equal(carteiraAntes.pontosReservados, "0.0000");
  assert.equal(carteiraAntes.pontosUtilizados, "0.0000");

  const descontoCupomEmCentavos = 333;
  const pedidoConsumo = await criarPedido({
    descontoCupomEmCentavos,
    creditoFidelidadeEmCentavos: creditoEmCentavos,
    pontosResgatados: pontos,
    baseElegivelEmCentavos,
    freteEmCentavos: 500,
    jurosEmCentavos: 77,
  });
  const brutoA = Math.floor(
    (baseElegivelEmCentavos + descontoCupomEmCentavos) / 3,
  );
  const brutoB = baseElegivelEmCentavos + descontoCupomEmCentavos - brutoA;
  const rateio = ratearCreditoFidelidadeEntreItens({
    itens: [
      { id: "a", valorBrutoEmCentavos: brutoA },
      { id: "b", valorBrutoEmCentavos: brutoB },
    ],
    descontoCupomEmCentavos,
    creditoFidelidadeEmCentavos: creditoEmCentavos,
  });
  const itens = await dbTransacional
    .insert(checkoutPedidoItensTable)
    .values([
      {
        pedidoId: pedidoConsumo.id,
        produtoId: randomUUID(),
        categoriaId,
        nomeProduto: "Item A integração 5B",
        quantidade: 1,
        precoUnitarioEmCentavos: brutoA,
        totalEmCentavos: brutoA,
        creditoFidelidadeRateadoEmCentavos: rateio.get("a") ?? 0,
      },
      {
        pedidoId: pedidoConsumo.id,
        produtoId: randomUUID(),
        categoriaId,
        nomeProduto: "Item B integração 5B",
        quantidade: 1,
        precoUnitarioEmCentavos: brutoB,
        totalEmCentavos: brutoB,
        creditoFidelidadeRateadoEmCentavos: rateio.get("b") ?? 0,
      },
    ])
    .returning();
  assert.equal(
    itens.reduce(
      (total, item) => total + item.creditoFidelidadeRateadoEmCentavos,
      0,
    ),
    creditoEmCentavos,
  );
  registrar("cupom + pontos e rateio determinístico nos itens");

  // O preview usa apenas cálculos: não pode criar reserva nem movimentar carteira.
  const reservasAntesDoPreview = await dbTransacional
    .select({ total: sql<number>`count(*)::int` })
    .from(reservasFidelidadeTable)
    .where(eq(reservasFidelidadeTable.pedidoId, pedidoConsumo.id));
  const limitesPreview = calcularLimitesResgate({
    saldoDisponivel: saldoInicial,
    pontosConversao: configuracao.pontosConversao,
    valorCreditoEmCentavos: configuracao.valorCreditoEmCentavos,
    baseElegivelEmCentavos,
    totalAntesJurosEmCentavos: baseElegivelEmCentavos + 500,
    valorMinimoPagamentoEmCentavos: 100,
  });
  assert.ok(numero(limitesPreview.maximoPontos) >= numero(pontos));
  const reservasDepoisDoPreview = await dbTransacional
    .select({ total: sql<number>`count(*)::int` })
    .from(reservasFidelidadeTable)
    .where(eq(reservasFidelidadeTable.pedidoId, pedidoConsumo.id));
  assert.equal(reservasAntesDoPreview[0]?.total, 0);
  assert.equal(reservasDepoisDoPreview[0]?.total, 0);
  assert.equal((await buscarCarteira()).pontosDisponiveis, saldoInicial);
  registrar("preview calcula limites sem criar reserva ou consumir pontos");

  const referenciaConsumo = `it5b:${sufixo}:consumo`;
  const reservaConsumo = await reservar({
    pedidoId: pedidoConsumo.id,
    pontos,
    baseElegivelEmCentavos,
    creditoEmCentavos,
    referencia: referenciaConsumo,
  });
  assert.equal(reservaConsumo.status, "reservada");
  let carteiraAtual = await buscarCarteira();
  assert.equal(
    numero(carteiraAtual.pontosDisponiveis),
    numero(saldoInicial) - numero(pontos),
  );
  assert.equal(carteiraAtual.pontosReservados, pontos);
  assert.equal(carteiraAtual.pontosUtilizados, "0.0000");
  assert.equal(
    pedidoConsumo.totalEmCentavos,
    baseElegivelEmCentavos - creditoEmCentavos + 500 + 77,
  );

  const retry = await reservar({
    pedidoId: pedidoConsumo.id,
    pontos,
    baseElegivelEmCentavos,
    creditoEmCentavos,
    referencia: referenciaConsumo,
  });
  assert.equal(retry.id, reservaConsumo.id);
  const [quantidadeReserva] = await dbTransacional
    .select({ total: sql<number>`count(*)::int` })
    .from(reservasFidelidadeTable)
    .where(eq(reservasFidelidadeTable.pedidoId, pedidoConsumo.id));
  assert.equal(quantidadeReserva?.total, 1);
  registrar("criação de reserva e retry idempotente");

  await dbTransacional
    .update(checkoutPedidosTable)
    .set({ pagamentoStatus: "paid", status: "paid" })
    .where(eq(checkoutPedidosTable.id, pedidoConsumo.id));
  await dbTransacional.transaction((tx) =>
    processarEventoPedidoFidelidade(
      tx,
      pedidoConsumo.id,
      "pagamento_confirmado",
    ),
  );
  await dbTransacional.transaction((tx) =>
    processarEventoPedidoFidelidade(
      tx,
      pedidoConsumo.id,
      "pagamento_confirmado",
    ),
  );
  const [reservaConsumida] = await dbTransacional
    .select()
    .from(reservasFidelidadeTable)
    .where(eq(reservasFidelidadeTable.id, reservaConsumo.id));
  assert.equal(reservaConsumida?.status, "consumida");
  const transacoesConsumo = await dbTransacional
    .select()
    .from(transacoesFidelidadeTable)
    .where(eq(transacoesFidelidadeTable.reservaId, reservaConsumo.id));
  assert.equal(
    transacoesConsumo.filter((item) => item.tipo === "consumo_resgate").length,
    1,
  );
  carteiraAtual = await buscarCarteira();
  assert.equal(carteiraAtual.pontosReservados, "0.0000");
  assert.equal(carteiraAtual.pontosUtilizados, pontos);
  registrar("consumo após pagamento sem duplicação em retry");

  const creditosGerados = await dbTransacional
    .select()
    .from(transacoesFidelidadeTable)
    .where(
      and(
        eq(transacoesFidelidadeTable.pedidoId, pedidoConsumo.id),
        eq(transacoesFidelidadeTable.tipo, "credito_pendente"),
      ),
    );
  assert.equal(creditosGerados.length, 2);
  assert.equal(
    creditosGerados.reduce(
      (total, item) => total + numero(item.valorBaseEmCentavos),
      0,
    ),
    baseElegivelEmCentavos - creditoEmCentavos,
  );
  registrar("novos pontos excluem cupom e parte paga com fidelidade");

  const [snapshotPedido] = await dbTransacional
    .select()
    .from(checkoutPedidosTable)
    .where(eq(checkoutPedidosTable.id, pedidoConsumo.id));
  assert.equal(snapshotPedido?.pontosResgatados, pontos);
  assert.equal(snapshotPedido?.creditoFidelidadeEmCentavos, creditoEmCentavos);
  assert.equal(snapshotPedido?.reservaFidelidadeId, reservaConsumo.id);
  assert.equal(
    snapshotPedido?.configuracaoFidelidadeVersao,
    configuracao.versao,
  );
  registrar("snapshots do pedido e dos itens persistidos");

  await dbTransacional
    .update(checkoutPedidosTable)
    .set({ status: "canceled" })
    .where(eq(checkoutPedidosTable.id, pedidoConsumo.id));
  await dbTransacional.transaction((tx) =>
    processarEventoPedidoFidelidade(tx, pedidoConsumo.id, "pedido_cancelado"),
  );
  await dbTransacional.transaction((tx) =>
    processarEventoPedidoFidelidade(tx, pedidoConsumo.id, "pedido_cancelado"),
  );
  const [reservaDevolvida] = await dbTransacional
    .select()
    .from(reservasFidelidadeTable)
    .where(eq(reservasFidelidadeTable.id, reservaConsumo.id));
  assert.equal(reservaDevolvida?.status, "devolvida");
  assert.equal(
    await contarMovimentosReserva(reservaConsumo.id, "devolucao_resgate"),
    1,
  );
  carteiraAtual = await buscarCarteira();
  assert.equal(carteiraAtual.pontosReservados, "0.0000");
  assert.equal(carteiraAtual.pontosUtilizados, "0.0000");
  assert.equal(carteiraAtual.pontosDisponiveis, saldoInicial);
  registrar("devolução por transação inversa após consumo");

  const pedidoExpirado = await criarPedido({
    creditoFidelidadeEmCentavos: creditoEmCentavos,
    pontosResgatados: pontos,
    baseElegivelEmCentavos,
  });
  const reservaExpirada = await reservar({
    pedidoId: pedidoExpirado.id,
    pontos,
    baseElegivelEmCentavos,
    creditoEmCentavos,
    referencia: `it5b:${sufixo}:expiracao`,
  });
  await dbTransacional.transaction((tx) =>
    processarReservaPedido(
      tx,
      pedidoExpirado.id,
      "liberar",
      "pagamento_expirado",
    ),
  );
  await dbTransacional.transaction((tx) =>
    processarReservaPedido(
      tx,
      pedidoExpirado.id,
      "liberar",
      "pagamento_expirado",
    ),
  );
  await dbTransacional
    .update(checkoutPedidosTable)
    .set({ pagamentoStatus: "paid", status: "paid" })
    .where(eq(checkoutPedidosTable.id, pedidoExpirado.id));
  await dbTransacional.transaction((tx) =>
    processarEventoPedidoFidelidade(
      tx,
      pedidoExpirado.id,
      "pagamento_confirmado",
    ),
  );
  const [expiradaDepoisDoWebhook] = await dbTransacional
    .select()
    .from(reservasFidelidadeTable)
    .where(eq(reservasFidelidadeTable.id, reservaExpirada.id));
  assert.equal(expiradaDepoisDoWebhook?.status, "liberada");
  assert.equal(
    await contarMovimentosReserva(reservaExpirada.id, "liberacao_resgate"),
    1,
  );
  registrar("expiração libera e webhook tardio não consome");

  const pedidoCancelado = await criarPedido({
    creditoFidelidadeEmCentavos: creditoEmCentavos,
    pontosResgatados: pontos,
    baseElegivelEmCentavos,
  });
  const reservaCancelada = await reservar({
    pedidoId: pedidoCancelado.id,
    pontos,
    baseElegivelEmCentavos,
    creditoEmCentavos,
    referencia: `it5b:${sufixo}:cancelamento`,
  });
  await dbTransacional
    .update(checkoutPedidosTable)
    .set({ status: "canceled" })
    .where(eq(checkoutPedidosTable.id, pedidoCancelado.id));
  await dbTransacional.transaction((tx) =>
    processarEventoPedidoFidelidade(tx, pedidoCancelado.id, "pedido_cancelado"),
  );
  await dbTransacional.transaction((tx) =>
    processarEventoPedidoFidelidade(tx, pedidoCancelado.id, "pedido_cancelado"),
  );
  const [cancelada] = await dbTransacional
    .select()
    .from(reservasFidelidadeTable)
    .where(eq(reservasFidelidadeTable.id, reservaCancelada.id));
  assert.equal(cancelada?.status, "liberada");
  assert.equal(
    await contarMovimentosReserva(reservaCancelada.id, "liberacao_resgate"),
    1,
  );
  registrar("cancelamento antes do pagamento libera reserva");

  const pedidoNaoRecebido = await criarPedido({
    creditoFidelidadeEmCentavos: creditoEmCentavos,
    pontosResgatados: pontos,
    baseElegivelEmCentavos,
  });
  const reservaNaoRecebida = await reservar({
    pedidoId: pedidoNaoRecebido.id,
    pontos,
    baseElegivelEmCentavos,
    creditoEmCentavos,
    referencia: `it5b:${sufixo}:nao-recebido`,
  });
  await dbTransacional.transaction((tx) =>
    processarEventoPedidoFidelidade(
      tx,
      pedidoNaoRecebido.id,
      "pagamento_estornado",
    ),
  );
  const [naoRecebida] = await dbTransacional
    .select()
    .from(reservasFidelidadeTable)
    .where(eq(reservasFidelidadeTable.id, reservaNaoRecebida.id));
  assert.equal(naoRecebida?.status, "liberada");
  registrar("pagamento na entrega não recebido libera reserva");

  const limitesProdutos = calcularLimitesResgate({
    saldoDisponivel: saldoInicial,
    pontosConversao: configuracao.pontosConversao,
    valorCreditoEmCentavos: configuracao.valorCreditoEmCentavos,
    baseElegivelEmCentavos: 1_000,
    totalAntesJurosEmCentavos: 1_600,
    valorMinimoPagamentoEmCentavos: 100,
  });
  assert.equal(limitesProdutos.limiteCreditoEmCentavos, 1_000);
  const limitesMinimo = calcularLimitesResgate({
    saldoDisponivel: saldoInicial,
    pontosConversao: configuracao.pontosConversao,
    valorCreditoEmCentavos: configuracao.valorCreditoEmCentavos,
    baseElegivelEmCentavos: 1_000,
    totalAntesJurosEmCentavos: 1_050,
    valorMinimoPagamentoEmCentavos: 100,
  });
  assert.equal(limitesMinimo.limiteCreditoEmCentavos, 950);
  registrar("pontos não pagam frete/juros e preservam R$ 1,00");

  const pedidoAcimaDoSaldo = await criarPedido({
    baseElegivelEmCentavos: baseElegivelEmCentavos * 100,
  });
  await assert.rejects(
    reservar({
      pedidoId: pedidoAcimaDoSaldo.id,
      pontos: pontosFormatados(numero(saldoInicial) + numero(pontos)),
      baseElegivelEmCentavos: baseElegivelEmCentavos * 100,
      creditoEmCentavos: calcularCreditoPontos({
        pontos: pontosFormatados(numero(saldoInicial) + numero(pontos)),
        pontosConversao: configuracao.pontosConversao,
        valorCreditoEmCentavos: configuracao.valorCreditoEmCentavos,
      }),
      referencia: `it5b:${sufixo}:acima-saldo`,
    }),
    /LIMITE_RESGATE_EXCEDIDO/,
  );
  const pedidoAcimaDoLimite = await criarPedido({
    baseElegivelEmCentavos: Math.max(creditoEmCentavos - 1, 0),
  });
  await assert.rejects(
    reservar({
      pedidoId: pedidoAcimaDoLimite.id,
      pontos,
      baseElegivelEmCentavos: Math.max(creditoEmCentavos - 1, 0),
      creditoEmCentavos,
      referencia: `it5b:${sufixo}:acima-limite`,
    }),
    /LIMITE_RESGATE_EXCEDIDO/,
  );
  registrar("tentativas acima do saldo e do limite do pedido são rejeitadas");

  await dbTransacional
    .update(carteirasFidelidadeTable)
    .set({
      pontosDisponiveis: pontos,
      pontosReservados: "0.0000",
      pontosUtilizados: "0.0000",
    })
    .where(eq(carteirasFidelidadeTable.id, carteiraId));
  const pedidoConcorrenteA = await criarPedido({
    creditoFidelidadeEmCentavos: creditoEmCentavos,
    pontosResgatados: pontos,
    baseElegivelEmCentavos,
  });
  const pedidoConcorrenteB = await criarPedido({
    creditoFidelidadeEmCentavos: creditoEmCentavos,
    pontosResgatados: pontos,
    baseElegivelEmCentavos,
  });
  const concorrentes = await Promise.allSettled([
    reservar({
      pedidoId: pedidoConcorrenteA.id,
      pontos,
      baseElegivelEmCentavos,
      creditoEmCentavos,
      referencia: `it5b:${sufixo}:concorrencia-a`,
    }),
    reservar({
      pedidoId: pedidoConcorrenteB.id,
      pontos,
      baseElegivelEmCentavos,
      creditoEmCentavos,
      referencia: `it5b:${sufixo}:concorrencia-b`,
    }),
  ]);
  assert.equal(
    concorrentes.filter((resultado) => resultado.status === "fulfilled").length,
    1,
  );
  assert.equal(
    concorrentes.filter((resultado) => resultado.status === "rejected").length,
    1,
  );
  const vencedor = concorrentes.find(
    (
      resultado,
    ): resultado is PromiseFulfilledResult<
      typeof reservasFidelidadeTable.$inferSelect
    > => resultado.status === "fulfilled",
  );
  assert.ok(vencedor);
  await dbTransacional.transaction((tx) =>
    processarReservaPedido(
      tx,
      vencedor.value.pedidoId,
      "liberar",
      "fim_teste_concorrencia",
    ),
  );
  registrar("duas tentativas concorrentes não duplicam uso do saldo");

  const [carteiraFinal] = await dbTransacional
    .select()
    .from(carteirasFidelidadeTable)
    .where(eq(carteirasFidelidadeTable.id, carteiraId));
  assert.equal(numero(carteiraFinal?.pontosDisponiveis), numero(pontos));
  assert.equal(numero(carteiraFinal?.pontosReservados), 0);
  assert.equal(numero(carteiraFinal?.pontosUtilizados), 0);
  const movimentosInvalidos = await dbTransacional.execute<{
    total: number;
  }>(sql`
    select count(*)::int as total
      from programa_fidelidade_transacoes t
      join programa_fidelidade_reservas r on r.id = t.reserva_id
     where r.cliente_id = ${clienteId}
       and (t.pontos <= 0 or t.valor_base_em_centavos < 0)
  `);
  assert.equal(movimentosInvalidos.rows[0]?.total, 0);
  const movimentosLedger = await dbTransacional.execute<{
    tipo: string;
    total: number;
  }>(sql`
    select tipo, count(*)::int as total
      from programa_fidelidade_transacoes
     where cliente_id = ${clienteId}
     group by tipo
  `);
  const totaisPorTipo = new Map(
    movimentosLedger.rows.map((movimento) => [movimento.tipo, movimento.total]),
  );
  assert.equal(totaisPorTipo.get("reserva_resgate"), 5);
  assert.equal(totaisPorTipo.get("consumo_resgate"), 1);
  assert.equal(totaisPorTipo.get("devolucao_resgate"), 1);
  assert.equal(totaisPorTipo.get("liberacao_resgate"), 4);
  registrar("carteira, reservas e ledger consistentes");
  console.log("[resgate-integracao:resultado]", {
    saldoInicial,
    pontosUtilizados: pontos,
    creditoEmCentavos,
    produtosAposCupomEmCentavos: baseElegivelEmCentavos,
    freteEmCentavos: 500,
    jurosEmCentavos: 77,
    totalMonetarioEmCentavos: pedidoConsumo.totalEmCentavos,
    saldoFinalDisponivel: carteiraFinal?.pontosDisponiveis,
    saldoFinalReservado: carteiraFinal?.pontosReservados,
    saldoFinalUtilizado: carteiraFinal?.pontosUtilizados,
    movimentosLedger: Object.fromEntries(totaisPorTipo),
  });
}

export const execucao = executar()
  .finally(limparFixtures)
  .finally(encerrarBancoTransacionalIntegracao);
