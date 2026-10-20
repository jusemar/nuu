import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

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
  transacoesFidelidadeTable,
} from "@/db/schema";
import {
  dbTransacional,
  encerrarBancoTransacionalIntegracao,
} from "@/db/transaction";

import { processarEventoPedidoFidelidade } from "./processar-evento-pedido-fidelidade";

type Transacao = Parameters<
  Parameters<typeof dbTransacional.transaction>[0]
>[0];

const PONTOS_ESPERADOS = "149.5000";
const ROLLBACK_TESTE = new Error("ROLLBACK_TESTE_FIDELIDADE");

async function criarClienteComCarteira(tx: Transacao, marcador: string) {
  const clienteId = randomUUID();
  const enderecoId = randomUUID();
  const carteiraId = randomUUID();

  await tx.insert(checkoutClientesTable).values({
    id: clienteId,
    nome: `Cliente integração ${marcador}`,
    email: `${marcador}-${randomUUID()}@example.invalid`,
    telefone: "11999999999",
    documento: randomUUID(),
  });
  await tx.insert(checkoutEnderecosTable).values({
    id: enderecoId,
    clienteId,
    cep: "00000000",
    rua: "Rua de integração",
    numero: "1",
    bairro: "Teste",
    cidade: "Teste",
    estado: "SP",
  });
  await tx.insert(carteirasFidelidadeTable).values({
    id: carteiraId,
    clienteId,
  });

  return { clienteId, enderecoId, carteiraId };
}

async function criarPedidoComItem({
  tx,
  clienteId,
  enderecoId,
  categoriaId,
  valorEmCentavos = 29_900,
}: {
  tx: Transacao;
  clienteId: string;
  enderecoId: string;
  categoriaId: string;
  valorEmCentavos?: number;
}) {
  const pedidoId = randomUUID();
  const [pedido] = await tx
    .insert(checkoutPedidosTable)
    .values({
      id: pedidoId,
      numeroPedido: `#IT-CICLO-${randomUUID()}`,
      clienteId,
      enderecoId,
      status: "pending",
      subtotalEmCentavos: valorEmCentavos,
      freteEmCentavos: 0,
      descontoEmCentavos: 0,
      descontoPromocionalEmCentavos: 0,
      descontoCupomEmCentavos: 0,
      economiaTotalEmCentavos: 0,
      totalEmCentavos: valorEmCentavos,
      gatewayPagamento: "stripe",
      pagamentoStatus: "pending",
    })
    .returning();
  assert.ok(pedido);

  await tx.insert(checkoutPedidoItensTable).values({
    pedidoId,
    produtoId: randomUUID(),
    categoriaId,
    nomeProduto: "Produto elegível de integração",
    quantidade: 1,
    precoUnitarioEmCentavos: valorEmCentavos,
    totalEmCentavos: valorEmCentavos,
  });

  return pedidoId;
}

async function buscarSaldo(tx: Transacao, carteiraId: string) {
  const [carteira] = await tx
    .select()
    .from(carteirasFidelidadeTable)
    .where(eq(carteirasFidelidadeTable.id, carteiraId));
  assert.ok(carteira);
  return carteira;
}

async function executarCiclo(tx: Transacao) {
  const categoriaParticipanteId = randomUUID();
  const categoriaNaoParticipanteId = randomUUID();
  const cliente = await criarClienteComCarteira(tx, "principal");
  const outroCliente = await criarClienteComCarteira(tx, "isolado");

  await tx.insert(categoryTable).values([
    {
      id: categoriaParticipanteId,
      name: "Categoria participante integração",
      slug: `participante-integracao-${randomUUID()}`,
    },
    {
      id: categoriaNaoParticipanteId,
      name: "Categoria não participante integração",
      slug: `nao-participante-integracao-${randomUUID()}`,
    },
  ]);

  // A configuração é alterada apenas dentro desta transação, que será revertida.
  await tx
    .insert(configuracoesProgramaFidelidadeTable)
    .values({
      id: "global",
      ativo: true,
      nomePublico: "Fidelidade integração",
      pontosPorReal: "1.0000",
      pontosConversao: "100.0000",
      valorCreditoEmCentavos: 100,
      minimoPontosResgate: "100.0000",
      mesesValidade: 12,
    })
    .onConflictDoUpdate({
      target: configuracoesProgramaFidelidadeTable.id,
      set: { ativo: true, pontosPorReal: "1.0000", updatedAt: new Date() },
    });
  await tx.insert(regrasCategoriasProgramaFidelidadeTable).values({
    categoriaId: categoriaParticipanteId,
    ativa: true,
    pontosPorReal: "0.5000",
  });

  const pedidoId = await criarPedidoComItem({
    tx,
    clienteId: cliente.clienteId,
    enderecoId: cliente.enderecoId,
    categoriaId: categoriaParticipanteId,
  });

  // Evento prematuro não pode conceder pontos antes de o pedido estar pago.
  await processarEventoPedidoFidelidade(tx, pedidoId, "pagamento_confirmado");
  let saldo = await buscarSaldo(tx, cliente.carteiraId);
  assert.equal(saldo.pontosPendentes, "0.0000");
  assert.equal(saldo.pontosDisponiveis, "0.0000");

  await tx
    .update(checkoutPedidosTable)
    .set({ status: "paid", pagamentoStatus: "paid" })
    .where(eq(checkoutPedidosTable.id, pedidoId));
  await processarEventoPedidoFidelidade(tx, pedidoId, "pagamento_confirmado");
  await processarEventoPedidoFidelidade(tx, pedidoId, "pagamento_confirmado");

  saldo = await buscarSaldo(tx, cliente.carteiraId);
  assert.equal(saldo.pontosPendentes, PONTOS_ESPERADOS);
  assert.equal(saldo.pontosDisponiveis, "0.0000");

  await tx
    .update(checkoutPedidosTable)
    .set({ status: "delivered" })
    .where(eq(checkoutPedidosTable.id, pedidoId));
  await processarEventoPedidoFidelidade(tx, pedidoId, "pedido_entregue");
  await processarEventoPedidoFidelidade(tx, pedidoId, "pedido_entregue");

  saldo = await buscarSaldo(tx, cliente.carteiraId);
  assert.equal(saldo.pontosPendentes, "0.0000");
  assert.equal(saldo.pontosDisponiveis, PONTOS_ESPERADOS);

  const ledger = await tx
    .select()
    .from(transacoesFidelidadeTable)
    .where(eq(transacoesFidelidadeTable.pedidoId, pedidoId));
  assert.equal(ledger.length, 2);
  assert.equal(
    ledger.filter((movimento) => movimento.tipo === "credito_pendente").length,
    1,
  );
  assert.equal(
    ledger.filter((movimento) => movimento.tipo === "liberacao").length,
    1,
  );
  assert.ok(ledger.every((movimento) => movimento.pontos === PONTOS_ESPERADOS));
  assert.ok(
    ledger.every((movimento) => movimento.clienteId === cliente.clienteId),
  );

  const [processamento] = await tx
    .select()
    .from(processamentosPedidosFidelidadeTable)
    .where(eq(processamentosPedidosFidelidadeTable.pedidoId, pedidoId));
  assert.equal(processamento?.situacao, "disponivel");

  // Sem opt-in explícito, pagamento confirmado deve registrar zero crédito.
  const pedidoNaoParticipanteId = await criarPedidoComItem({
    tx,
    clienteId: cliente.clienteId,
    enderecoId: cliente.enderecoId,
    categoriaId: categoriaNaoParticipanteId,
  });
  await tx
    .update(checkoutPedidosTable)
    .set({ status: "paid", pagamentoStatus: "paid" })
    .where(eq(checkoutPedidosTable.id, pedidoNaoParticipanteId));
  await processarEventoPedidoFidelidade(
    tx,
    pedidoNaoParticipanteId,
    "pagamento_confirmado",
  );
  saldo = await buscarSaldo(tx, cliente.carteiraId);
  assert.equal(saldo.pontosDisponiveis, PONTOS_ESPERADOS);
  assert.equal(
    (
      await tx
        .select()
        .from(transacoesFidelidadeTable)
        .where(eq(transacoesFidelidadeTable.pedidoId, pedidoNaoParticipanteId))
    ).length,
    0,
  );

  // Programa desligado prevalece até sobre uma categoria participante.
  await tx
    .update(configuracoesProgramaFidelidadeTable)
    .set({ ativo: false })
    .where(eq(configuracoesProgramaFidelidadeTable.id, "global"));
  const pedidoProgramaInativoId = await criarPedidoComItem({
    tx,
    clienteId: cliente.clienteId,
    enderecoId: cliente.enderecoId,
    categoriaId: categoriaParticipanteId,
  });
  await tx
    .update(checkoutPedidosTable)
    .set({ status: "paid", pagamentoStatus: "paid" })
    .where(eq(checkoutPedidosTable.id, pedidoProgramaInativoId));
  await processarEventoPedidoFidelidade(
    tx,
    pedidoProgramaInativoId,
    "pagamento_confirmado",
  );
  saldo = await buscarSaldo(tx, cliente.carteiraId);
  assert.equal(saldo.pontosDisponiveis, PONTOS_ESPERADOS);

  const saldoOutroCliente = await buscarSaldo(tx, outroCliente.carteiraId);
  assert.equal(saldoOutroCliente.pontosPendentes, "0.0000");
  assert.equal(saldoOutroCliente.pontosDisponiveis, "0.0000");

  console.log("[fidelidade:ciclo-integracao]", {
    pontosEsperados: PONTOS_ESPERADOS,
    pendentesAposPagamento: PONTOS_ESPERADOS,
    disponiveisAposPagamento: "0.0000",
    pendentesAposEntrega: "0.0000",
    disponiveisAposEntrega: PONTOS_ESPERADOS,
    movimentosLedger: ledger.map((movimento) => movimento.tipo),
    idempotenciaPagamento: "ok",
    idempotenciaEntrega: "ok",
    isolamentoCliente: "ok",
  });
}

async function executar() {
  try {
    await dbTransacional.transaction(async (tx) => {
      await executarCiclo(tx);
      // Rollback intencional: nenhuma fixture sobrevive ao teste.
      throw ROLLBACK_TESTE;
    });
  } catch (erro) {
    if (erro !== ROLLBACK_TESTE) throw erro;
  } finally {
    await encerrarBancoTransacionalIntegracao();
  }
}

export const execucao = executar();
