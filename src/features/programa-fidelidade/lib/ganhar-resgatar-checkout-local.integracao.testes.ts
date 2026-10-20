import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";

import {
  carteirasFidelidadeTable,
  categoryTable,
  checkoutClientesTable,
  checkoutEnderecosTable,
  checkoutEstoqueAlocacoesTable,
  checkoutPagamentosTable,
  checkoutPedidosTable,
  configuracoesProgramaFidelidadeTable,
  marcaTable,
  modelosRetiradaTable,
  processamentosPedidosFidelidadeTable,
  productPricingTable,
  productTable,
  productVariantTable,
  regrasCategoriasProgramaFidelidadeTable,
  reservasFidelidadeTable,
  transacoesFidelidadeTable,
  userTable,
} from "@/db/schema";
import {
  dbTransacional,
  encerrarBancoTransacionalIntegracao,
} from "@/db/transaction";
import { confirmarPagamentoRecebido } from "@/features/checkout/actions/pagamentos/confirmar-pagamento-recebido";
import { criarPedidoCheckoutVisitanteInterno } from "@/features/checkout/actions/pedido/criar-pedido-checkout-visitante";
import { calcularPreviaTotaisPedidoInterno } from "@/features/checkout/queries/previa-totais/calcular-previa-totais-pedido-interno";
import { calcularResumoCheckout } from "@/features/checkout/queries/resumo-checkout/calcular-resumo-checkout";

import { calcularPontosPorValor } from "./calcular-pontos-pedido";
import { processarEventoPedidoFidelidade } from "./processar-evento-pedido-fidelidade";

const marcador = `it-ganhar-resgatar-${randomUUID()}`;
const usuarioId = marcador;
const clienteId = randomUUID();
const categoriaId = randomUUID();
const marcaId = randomUUID();
const modeloRetiradaId = randomUUID();
const produtoId = randomUUID();
const pedidosIds: string[] = [];
const precoEmCentavos = 50_000;
const pontosGerados = "500.0000";

const itemCarrinho = {
  id: `item-${marcador}`,
  produtoId,
  nome: "Produto integração ganhar e resgatar",
  sku: `SKU-${marcador}`,
  modalidadeTipo: "stock",
  modalidadeTitulo: "Pronta entrega",
  imagemUrl: "https://example.invalid/produto.png",
  precoEmCentavos,
  quantidade: 1,
  freteEscolhido: {
    id: "retirada" as const,
    nome: "Retirada integração",
    prazo: "Disponível imediatamente",
    valorEmCentavos: 0,
    cep: "30110000",
  },
};

async function prepararFixture() {
  const configuracao = await dbTransacional.query.configuracoesProgramaFidelidadeTable.findFirst({
    where: eq(configuracoesProgramaFidelidadeTable.id, "global"),
  });
  assert.ok(configuracao?.ativo, "programa local deve estar ativo");
  assert.equal(
    calcularPontosPorValor({
      valorEmCentavos: precoEmCentavos,
      taxaPontosPorReal: configuracao.pontosPorReal,
    }),
    pontosGerados,
    "a configuração persistida deve gerar exatamente 500 pontos neste pedido",
  );
  assert.ok(Number(configuracao.minimoPontosResgate) <= 200);

  await dbTransacional.insert(userTable).values({
    id: usuarioId,
    name: "Cliente integração ganhar e resgatar",
    email: `${marcador}@example.invalid`,
    emailVerified: true,
  });
  await dbTransacional.insert(checkoutClientesTable).values({
    id: clienteId,
    userId: usuarioId,
    nome: "Cliente integração ganhar e resgatar",
    email: `${marcador}@example.invalid`,
    telefone: "11999999999",
    documento: randomUUID(),
  });
  await dbTransacional.insert(categoryTable).values({
    id: categoriaId,
    name: "Categoria integração ganhar e resgatar",
    slug: `categoria-${marcador}`,
  });
  await dbTransacional.insert(regrasCategoriasProgramaFidelidadeTable).values({
    categoriaId,
    ativa: true,
  });
  await dbTransacional.insert(marcaTable).values({
    id: marcaId,
    nome: "Marca integração ganhar e resgatar",
    slug: `marca-${marcador}`,
  });
  await dbTransacional.insert(modelosRetiradaTable).values({
    id: modeloRetiradaId,
    nome: "Retirada integração",
    prazoTexto: "Disponível imediatamente",
    ativo: true,
  });
  await dbTransacional.insert(productTable).values({
    id: produtoId,
    categoryId: categoriaId,
    name: "Produto integração ganhar e resgatar",
    slug: `produto-${marcador}`,
    description: "Fixture isolada do ciclo ganhar e resgatar.",
    marcaId,
    sku: `SKU-${marcador}`,
    productKind: "simple",
    status: "published",
    allowedDeliveryTypes: ["own"],
    weight: 500,
    length: 20,
    width: 15,
    height: 10,
    allowsOwnDelivery: false,
    allowsPickup: true,
    modeloRetiradaId,
    disponibilidadeFreteExterno: "desativado",
  });
  await dbTransacional.insert(productPricingTable).values({
    productId: produtoId,
    type: "stock",
    price: precoEmCentavos,
    mainCardPrice: true,
    isActive: true,
  });
  await dbTransacional.insert(productVariantTable).values({
    productId: produtoId,
    sku: `SKU-${marcador}`,
    name: "Variante técnica",
    attributes: {},
    priceInCents: precoEmCentavos,
    stockQuantity: 10,
    isActive: true,
    isDefault: true,
  });
  return configuracao;
}

async function limparFixture() {
  for (const pedidoId of pedidosIds) {
    await dbTransacional.delete(checkoutEstoqueAlocacoesTable)
      .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoId));
    await dbTransacional.delete(transacoesFidelidadeTable)
      .where(eq(transacoesFidelidadeTable.pedidoId, pedidoId));
    await dbTransacional.delete(processamentosPedidosFidelidadeTable)
      .where(eq(processamentosPedidosFidelidadeTable.pedidoId, pedidoId));
    await dbTransacional.delete(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pedidoId));
    await dbTransacional.delete(checkoutPedidosTable)
      .where(eq(checkoutPedidosTable.id, pedidoId));
  }
  await dbTransacional.delete(checkoutEnderecosTable)
    .where(eq(checkoutEnderecosTable.clienteId, clienteId));
  await dbTransacional.delete(carteirasFidelidadeTable)
    .where(eq(carteirasFidelidadeTable.clienteId, clienteId));
  await dbTransacional.delete(checkoutClientesTable)
    .where(eq(checkoutClientesTable.id, clienteId));
  await dbTransacional.delete(userTable)
    .where(eq(userTable.id, usuarioId));
  await dbTransacional.delete(productTable)
    .where(eq(productTable.id, produtoId));
  await dbTransacional.delete(modelosRetiradaTable)
    .where(eq(modelosRetiradaTable.id, modeloRetiradaId));
  await dbTransacional.delete(marcaTable)
    .where(eq(marcaTable.id, marcaId));
  await dbTransacional.delete(categoryTable)
    .where(eq(categoryTable.id, categoriaId));
}

async function buscarCarteira() {
  return dbTransacional.query.carteirasFidelidadeTable.findFirst({
    where: eq(carteirasFidelidadeTable.clienteId, clienteId),
  });
}

async function criarPedido(etiqueta: string, pontosResgate?: string) {
  const resumo = await calcularResumoCheckout({
    itens: [itemCarrinho],
    cepEntrega: "30110000",
  });
  const grupo = resumo?.cotacoesEntrega[0];
  const retirada = grupo?.opcoes.find((opcao) => opcao.tipo === "retirada");
  assert.ok(grupo && retirada);
  const selecaoEntrega = {
    chaveGrupo: grupo.chaveGrupo,
    identificador: retirada.identificador,
    nome: retirada.nome,
    descricao: retirada.descricao ?? null,
    prazoMinimoEmDiasUteis: retirada.prazoMinimoEmDiasUteis ?? null,
    prazoMaximoEmDiasUteis: retirada.prazoMaximoEmDiasUteis ?? null,
    valorEmCentavos: retirada.valorEmCentavos,
    tipo: retirada.tipo,
    provedor: retirada.provedor,
    servico: retirada.servico,
    cep: "30110000",
  };
  const previa = pontosResgate
    ? await calcularPreviaTotaisPedidoInterno({
        itens: [itemCarrinho],
        checkoutClienteId: clienteId,
        consultarFidelidade: true,
        pontosResgate,
        formaPagamento: "pix",
        freteEmCentavosOficial: retirada.valorEmCentavos,
        cepEntrega: "30110000",
        cidadeEntrega: "Belo Horizonte",
        estadoEntrega: "MG",
      })
    : null;
  const pedido = await criarPedidoCheckoutVisitanteInterno({
    dados: {
      nome: "Cliente integração ganhar e resgatar",
      email: `${marcador}@example.invalid`,
      telefone: "11999999999",
      documento: randomUUID(),
      cep: "30110000",
      rua: "Rua da Integração",
      numero: "100",
      bairro: "Centro",
      cidade: "Belo Horizonte",
      estado: "MG",
      pontosResgate,
      formaPagamento: "pix",
      chaveIdempotencia: `${marcador}-${etiqueta}`,
      selecoesEntregaPorGrupo: [selecaoEntrega],
      itens: [itemCarrinho],
    },
    email: `${marcador}@example.invalid`,
    documento: (await dbTransacional.query.checkoutClientesTable.findFirst({
      where: eq(checkoutClientesTable.id, clienteId),
    }))!.documento,
    telefone: "11999999999",
    produtosIds: [produtoId],
    usuarioId,
  });
  pedidosIds.push(pedido.pedidoId);
  return { pedido, previa };
}

async function confirmarPagamento(pedidoId: string, pagamentoId: string) {
  await dbTransacional.transaction(async (tx) => {
    await tx.update(checkoutPagamentosTable)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(checkoutPagamentosTable.id, pagamentoId));
    const resultado = await confirmarPagamentoRecebido(tx, pedidoId);
    assert.equal(resultado.recursos, "prontos");
    await processarEventoPedidoFidelidade(tx, pedidoId, "pagamento_confirmado");
    await processarEventoPedidoFidelidade(tx, pedidoId, "pagamento_confirmado");
  });
}

async function executar() {
  try {
    const configuracao = await prepararFixture();
    assert.equal(await buscarCarteira(), undefined, "carteira inicial não deve existir");

    const primeiro = await criarPedido("ganho");
    const primeiroPedido = await dbTransacional.query.checkoutPedidosTable.findFirst({
      where: eq(checkoutPedidosTable.id, primeiro.pedido.pedidoId),
    });
    assert.equal(primeiroPedido?.subtotalEmCentavos, precoEmCentavos);
    await confirmarPagamento(primeiro.pedido.pedidoId, primeiro.pedido.pagamentoId);
    let carteira = await buscarCarteira();
    assert.equal(carteira?.pontosPendentes, pontosGerados);
    assert.equal(carteira?.pontosDisponiveis, "0.0000");
    const [credito] = await dbTransacional.select().from(transacoesFidelidadeTable)
      .where(eq(transacoesFidelidadeTable.pedidoId, primeiro.pedido.pedidoId));
    assert.equal(credito?.tipo, "credito_pendente");
    assert.equal(credito?.pontos, pontosGerados);
    assert.equal(credito?.valorBaseEmCentavos, String(precoEmCentavos));

    await dbTransacional.transaction(async (tx) => {
      await tx.update(checkoutPedidosTable).set({ status: "delivered" })
        .where(eq(checkoutPedidosTable.id, primeiro.pedido.pedidoId));
      await processarEventoPedidoFidelidade(tx, primeiro.pedido.pedidoId, "pedido_entregue");
      await processarEventoPedidoFidelidade(tx, primeiro.pedido.pedidoId, "pedido_entregue");
    });
    carteira = await buscarCarteira();
    assert.equal(carteira?.pontosPendentes, "0.0000");
    assert.equal(carteira?.pontosDisponiveis, pontosGerados);
    assert.equal(carteira?.pontosReservados, "0.0000");

    const pontosResgate = configuracao.minimoPontosResgate;
    const segundo = await criarPedido("resgate", pontosResgate);
    assert.ok(segundo.previa?.fidelidade);
    const creditoEsperado = Number(pontosResgate) /
      Number(configuracao.pontosConversao) * configuracao.valorCreditoEmCentavos;
    assert.equal(segundo.previa.fidelidade.creditoAplicadoEmCentavos, creditoEsperado);
    const previaPix = segundo.previa.totaisPorFormaPagamento.pix;
    const pedidoPersistido = await dbTransacional.query.checkoutPedidosTable.findFirst({
      where: eq(checkoutPedidosTable.id, segundo.pedido.pedidoId),
    });
    const reserva = await dbTransacional.query.reservasFidelidadeTable.findFirst({
      where: eq(reservasFidelidadeTable.pedidoId, segundo.pedido.pedidoId),
    });
    assert.ok(pedidoPersistido && reserva);
    assert.equal(pedidoPersistido.subtotalEmCentavos, previaPix.subtotalEmCentavos);
    assert.equal(pedidoPersistido.descontoCupomEmCentavos, previaPix.descontoCupomEmCentavos);
    assert.equal(pedidoPersistido.creditoFidelidadeEmCentavos, creditoEsperado);
    assert.equal(pedidoPersistido.freteEmCentavos, previaPix.freteEmCentavos);
    assert.equal(pedidoPersistido.totalEmCentavos, previaPix.totalEstimadoEmCentavos);
    assert.equal(pedidoPersistido.pontosResgatados, pontosResgate);
    assert.equal(reserva.pontos, pontosResgate);
    assert.equal(reserva.creditoEmCentavos, creditoEsperado);
    assert.equal(reserva.status, "reservada");
    carteira = await buscarCarteira();
    assert.equal(Number(carteira?.pontosDisponiveis), 500 - Number(pontosResgate));
    assert.equal(carteira?.pontosReservados, pontosResgate);

    // Os 200 pontos reservados deixam somente 300 disponíveis para outro pedido.
    await assert.rejects(
      () => criarPedido("gasto-duplo", "400.0000"),
      /LIMITE_RESGATE_EXCEDIDO|SALDO_FIDELIDADE_INSUFICIENTE|SALDO_FIDELIDADE_CONCORRENTE/,
    );
    const pedidoGastoDuplo = await dbTransacional.query.checkoutPedidosTable.findFirst({
      where: eq(checkoutPedidosTable.chaveIdempotencia, `${marcador}-gasto-duplo`),
    });
    assert.equal(pedidoGastoDuplo, undefined);
    assert.equal((await buscarCarteira())?.pontosReservados, pontosResgate);

    const repeticao = await criarPedidoCheckoutVisitanteInterno({
      dados: {
        nome: "Cliente integração ganhar e resgatar",
        email: `${marcador}@example.invalid`,
        telefone: "11999999999",
        documento: randomUUID(),
        cep: "30110000",
        rua: "Rua da Integração",
        numero: "100",
        bairro: "Centro",
        cidade: "Belo Horizonte",
        estado: "MG",
        pontosResgate,
        formaPagamento: "pix",
        chaveIdempotencia: `${marcador}-resgate`,
        selecoesEntregaPorGrupo: [],
        itens: [itemCarrinho],
      },
      email: `${marcador}@example.invalid`,
      documento: (await dbTransacional.query.checkoutClientesTable.findFirst({
        where: eq(checkoutClientesTable.id, clienteId),
      }))!.documento,
      telefone: "11999999999",
      produtosIds: [produtoId],
      usuarioId,
    });
    assert.equal(repeticao.pedidoId, segundo.pedido.pedidoId);
    assert.equal((await buscarCarteira())?.pontosReservados, pontosResgate);

    await confirmarPagamento(segundo.pedido.pedidoId, segundo.pedido.pagamentoId);
    const reservaConsumida = await dbTransacional.query.reservasFidelidadeTable.findFirst({
      where: eq(reservasFidelidadeTable.id, reserva.id),
    });
    carteira = await buscarCarteira();
    assert.equal(reservaConsumida?.status, "consumida");
    assert.equal(carteira?.pontosReservados, "0.0000");
    assert.equal(Number(carteira?.pontosDisponiveis), 500 - Number(pontosResgate));
    assert.equal(carteira?.pontosUtilizados, pontosResgate);
    const ledger = await dbTransacional.select().from(transacoesFidelidadeTable)
      .where(eq(transacoesFidelidadeTable.clienteId, clienteId));
    assert.equal(ledger.filter((movimento) => movimento.tipo === "credito_pendente").length, 2);
    assert.equal(ledger.filter((movimento) => movimento.tipo === "liberacao").length, 1);
    assert.equal(ledger.filter((movimento) => movimento.tipo === "reserva_resgate").length, 1);
    assert.equal(ledger.filter((movimento) => movimento.tipo === "consumo_resgate").length, 1);
    assert.equal(ledger.filter((movimento) => movimento.tipo === "consumo_resgate")[0]?.pontos, pontosResgate);
    const [contagemReservas] = await dbTransacional.select({ total: sql<number>`count(*)::int` })
      .from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.clienteId, clienteId));
    assert.equal(contagemReservas?.total, 1, "resgate não pode reservar duas vezes");

    console.log("[fidelidade:ganhar-resgatar-local]", {
      marcador,
      pedidoGanho: primeiro.pedido.pedidoId,
      baseElegivelEmCentavos: Number(credito.valorBaseEmCentavos),
      pontosGerados,
      pendentesAposPagamento: pontosGerados,
      disponiveisAposEntrega: "500.0000",
      pontosResgate,
      creditoEmCentavos: creditoEsperado,
      totalPreviaEmCentavos: previaPix.totalEstimadoEmCentavos,
      totalPedidoEmCentavos: pedidoPersistido.totalEmCentavos,
      saldoAposReserva: 500 - Number(pontosResgate),
      reservaAposPagamento: reservaConsumida?.status,
      ledger: ledger.map((movimento) => movimento.tipo),
      idempotencia: "ok",
      gastoDuplo: "bloqueado",
    });
  } finally {
    await limparFixture();
    await encerrarBancoTransacionalIntegracao();
  }
}

export const execucao = executar();
