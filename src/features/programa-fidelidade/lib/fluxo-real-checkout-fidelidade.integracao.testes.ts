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
  checkoutPedidoItensTable,
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
import { liberarAlocacoesEstoquePedido } from "@/features/checkout/actions/estoque/liberar-alocacoes-estoque-pedido";
import { confirmarPagamentoRecebido } from "@/features/checkout/actions/pagamentos/confirmar-pagamento-recebido";
import { criarPedidoCheckoutVisitanteInterno } from "@/features/checkout/actions/pedido/criar-pedido-checkout-visitante";
import { expirarPagamentoPendente } from "@/features/checkout/lib/pagamentos/expirar-pagamento-pendente";
import { calcularPreviaTotaisPedidoInterno } from "@/features/checkout/queries/previa-totais/calcular-previa-totais-pedido-interno";
import { calcularResumoCheckout } from "@/features/checkout/queries/resumo-checkout/calcular-resumo-checkout";

import { processarEventoPedidoFidelidade } from "./processar-evento-pedido-fidelidade";

const sufixo = randomUUID();
const usuarioId = `it-fluxo-real-${sufixo}`;
const clienteId = randomUUID();
const carteiraId = randomUUID();
const categoriaId = randomUUID();
const marcaId = randomUUID();
const modeloRetiradaId = randomUUID();
const produtoId = randomUUID();
const itemCarrinhoId = `item-fluxo-real-${sufixo}`;
const pontosSolicitados = "500.0000";
const saldoInicial = "2000.0000";
const precoUnitarioEmCentavos = 30_000;
const quantidade = 2;
const subtotalEsperadoEmCentavos = 60_000;
const creditoEsperadoEmCentavos = 500;
const totalEsperadoEmCentavos = 59_500;

let configuracaoAnterior:
  | typeof configuracoesProgramaFidelidadeTable.$inferSelect
  | null = null;
let pedidoId: string | null = null;
let pedidoCanceladoId: string | null = null;
const pedidosExtrasIds: string[] = [];

const itemCarrinho = {
  id: itemCarrinhoId,
  produtoId,
  nome: "Produto integração fluxo real",
  sku: `SKU-${sufixo}`,
  modalidadeTipo: "stock",
  modalidadeTitulo: "Pronta entrega",
  imagemUrl: "https://example.invalid/produto.png",
  precoEmCentavos: precoUnitarioEmCentavos,
  quantidade,
  freteEscolhido: {
    id: "retirada" as const,
    nome: "Retirada integração",
    prazo: "Disponível imediatamente",
    valorEmCentavos: 0,
    cep: "30110000",
  },
};

async function prepararFixtures() {
  configuracaoAnterior =
    (await dbTransacional.query.configuracoesProgramaFidelidadeTable.findFirst({
      where: eq(configuracoesProgramaFidelidadeTable.id, "global"),
    })) ?? null;

  await dbTransacional
    .insert(configuracoesProgramaFidelidadeTable)
    .values({
      id: "global",
      ativo: true,
      nomePublico: "Fidelidade",
      pontosPorReal: "1.0000",
      pontosConversao: "100.0000",
      valorCreditoEmCentavos: 100,
      minimoPontosResgate: "100.0000",
      mesesValidade: 12,
      versao: 1,
    })
    .onConflictDoUpdate({
      target: configuracoesProgramaFidelidadeTable.id,
      set: {
        ativo: true,
        pontosPorReal: "1.0000",
        pontosConversao: "100.0000",
        valorCreditoEmCentavos: 100,
        minimoPontosResgate: "100.0000",
        versao: 1,
        updatedAt: new Date(),
      },
    });

  await dbTransacional.insert(userTable).values({
    id: usuarioId,
    name: "Cliente Fluxo Real",
    email: `fluxo-real-${sufixo}@example.invalid`,
    emailVerified: true,
  });
  await dbTransacional.insert(checkoutClientesTable).values({
    id: clienteId,
    userId: usuarioId,
    nome: "Cliente Fluxo Real",
    email: `fluxo-real-${sufixo}@example.invalid`,
    telefone: "11999999999",
    documento: randomUUID(),
  });
  await dbTransacional.insert(carteirasFidelidadeTable).values({
    id: carteiraId,
    clienteId,
    pontosDisponiveis: saldoInicial,
  });
  await dbTransacional.insert(categoryTable).values({
    id: categoriaId,
    name: "Categoria fluxo real",
    slug: `categoria-fluxo-real-${sufixo}`,
  });
  await dbTransacional
    .insert(regrasCategoriasProgramaFidelidadeTable)
    .values({ categoriaId, ativa: true });
  await dbTransacional.insert(marcaTable).values({
    id: marcaId,
    nome: "Marca fluxo real",
    slug: `marca-fluxo-real-${sufixo}`,
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
    name: "Produto integração fluxo real",
    slug: `produto-fluxo-real-${sufixo}`,
    description: "Fixture isolada do fluxo real de checkout.",
    marcaId,
    sku: `SKU-${sufixo}`,
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
    price: precoUnitarioEmCentavos,
    mainCardPrice: true,
    isActive: true,
  });
  await dbTransacional.insert(productVariantTable).values({
    productId: produtoId,
    sku: `SKU-${sufixo}`,
    name: "Variante técnica",
    attributes: {},
    priceInCents: precoUnitarioEmCentavos,
    stockQuantity: 10,
    isActive: true,
    isDefault: true,
  });
}

async function limparFixtures() {
  for (const id of [pedidoId, pedidoCanceladoId, ...pedidosExtrasIds].filter((valor): valor is string => Boolean(valor))) {
    await dbTransacional
      .delete(checkoutEstoqueAlocacoesTable)
      .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, id));
    await dbTransacional
      .delete(transacoesFidelidadeTable)
      .where(eq(transacoesFidelidadeTable.pedidoId, id));
    await dbTransacional
      .delete(processamentosPedidosFidelidadeTable)
      .where(eq(processamentosPedidosFidelidadeTable.pedidoId, id));
    await dbTransacional
      .delete(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, id));
    await dbTransacional
      .delete(checkoutPedidosTable)
      .where(eq(checkoutPedidosTable.id, id));
  }
  await dbTransacional
    .delete(checkoutEnderecosTable)
    .where(eq(checkoutEnderecosTable.clienteId, clienteId));
  await dbTransacional
    .delete(carteirasFidelidadeTable)
    .where(eq(carteirasFidelidadeTable.id, carteiraId));
  await dbTransacional
    .delete(checkoutClientesTable)
    .where(eq(checkoutClientesTable.id, clienteId));
  await dbTransacional.delete(userTable).where(eq(userTable.id, usuarioId));
  await dbTransacional
    .delete(productTable)
    .where(eq(productTable.id, produtoId));
  await dbTransacional
    .delete(modelosRetiradaTable)
    .where(eq(modelosRetiradaTable.id, modeloRetiradaId));
  await dbTransacional.delete(marcaTable).where(eq(marcaTable.id, marcaId));
  await dbTransacional
    .delete(categoryTable)
    .where(eq(categoryTable.id, categoriaId));

  if (configuracaoAnterior) {
    await dbTransacional
      .update(configuracoesProgramaFidelidadeTable)
      .set({
        ativo: configuracaoAnterior.ativo,
        nomePublico: configuracaoAnterior.nomePublico,
        pontosPorReal: configuracaoAnterior.pontosPorReal,
        pontosConversao: configuracaoAnterior.pontosConversao,
        valorCreditoEmCentavos: configuracaoAnterior.valorCreditoEmCentavos,
        minimoPontosResgate: configuracaoAnterior.minimoPontosResgate,
        mesesValidade: configuracaoAnterior.mesesValidade,
        versao: configuracaoAnterior.versao,
        updatedAt: configuracaoAnterior.updatedAt,
      })
      .where(eq(configuracoesProgramaFidelidadeTable.id, "global"));
  } else {
    await dbTransacional
      .delete(configuracoesProgramaFidelidadeTable)
      .where(eq(configuracoesProgramaFidelidadeTable.id, "global"));
  }
}

async function executar() {
  try {
    await prepararFixtures();

    const [carteiraAntesDaPrevia] = await dbTransacional
      .select()
      .from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(carteiraAntesDaPrevia?.pontosDisponiveis, saldoInicial);
    assert.equal(carteiraAntesDaPrevia?.pontosReservados, "0.0000");

    const resumoEntrega = await calcularResumoCheckout({
      itens: [itemCarrinho],
      cepEntrega: "30110000",
    });
    const grupo = resumoEntrega?.cotacoesEntrega[0];
    const retirada = grupo?.opcoes.find((opcao) => opcao.tipo === "retirada");
    assert.ok(grupo && retirada, "retirada da fixture não foi disponibilizada");
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

    const previa = await calcularPreviaTotaisPedidoInterno({
      itens: [itemCarrinho],
      freteEmCentavosOficial: retirada.valorEmCentavos,
      aplicarFreteGratisPromocional: true,
      cepEntrega: "30110000",
      cidadeEntrega: "Belo Horizonte",
      estadoEntrega: "MG",
      consultarFidelidade: true,
      pontosResgate: pontosSolicitados,
      formaPagamento: "pix",
      checkoutClienteId: clienteId,
    });
    assert.ok(previa?.fidelidade);
    const previaPix = previa.totaisPorFormaPagamento.pix;
    assert.equal(previaPix.subtotalEmCentavos, subtotalEsperadoEmCentavos);
    assert.equal(previaPix.descontoCupomEmCentavos, 0);
    assert.equal(
      previa.fidelidade.creditoAplicadoEmCentavos,
      creditoEsperadoEmCentavos,
    );
    assert.equal(previaPix.freteEmCentavos, 0);
    assert.equal(previaPix.totalEstimadoEmCentavos, totalEsperadoEmCentavos);
    assert.equal(
      await dbTransacional.query.reservasFidelidadeTable.findFirst({
        where: eq(reservasFidelidadeTable.clienteId, clienteId),
      }),
      undefined,
    );

    // Cada linha cabe nas dez unidades, mas juntas pedem doze. A falha
    // vinculante de estoque acontece antes de qualquer reserva de pontos.
    const itensSemEstoque = [
      { ...itemCarrinho, id: `${itemCarrinhoId}-falha-a`, quantidade: 6 },
      { ...itemCarrinho, id: `${itemCarrinhoId}-falha-b`, quantidade: 6 },
    ];
    const resumoSemEstoque = await calcularResumoCheckout({
      itens: itensSemEstoque,
      cepEntrega: "30110000",
    });
    const grupoFalha = resumoSemEstoque?.cotacoesEntrega[0];
    const retiradaFalha = grupoFalha?.opcoes.find((opcao) => opcao.tipo === "retirada");
    assert.ok(grupoFalha && retiradaFalha);
    const tentativaSemEstoque = await Promise.allSettled([
      criarPedidoCheckoutVisitanteInterno({
        dados: {
          nome: "Cliente Fluxo Real",
          email: `fluxo-real-${sufixo}@example.invalid`,
          telefone: "11999999999",
          documento: randomUUID(),
          cep: "30110000",
          rua: "Rua da Integração",
          numero: "100",
          bairro: "Centro",
          cidade: "Belo Horizonte",
          estado: "MG",
          pontosResgate: pontosSolicitados,
          formaPagamento: "pix",
          chaveIdempotencia: `fluxo-real-${sufixo}-sem-estoque`,
          selecoesEntregaPorGrupo: [{
            chaveGrupo: grupoFalha.chaveGrupo,
            identificador: retiradaFalha.identificador,
            nome: retiradaFalha.nome,
            descricao: retiradaFalha.descricao ?? null,
            prazoMinimoEmDiasUteis: retiradaFalha.prazoMinimoEmDiasUteis ?? null,
            prazoMaximoEmDiasUteis: retiradaFalha.prazoMaximoEmDiasUteis ?? null,
            valorEmCentavos: retiradaFalha.valorEmCentavos,
            tipo: retiradaFalha.tipo,
            provedor: retiradaFalha.provedor,
            servico: retiradaFalha.servico,
            cep: "30110000",
          }],
          itens: itensSemEstoque,
        },
        email: `fluxo-real-${sufixo}@example.invalid`,
        documento: (await dbTransacional.query.checkoutClientesTable.findFirst({
          where: eq(checkoutClientesTable.id, clienteId),
        }))!.documento,
        telefone: "11999999999",
        produtosIds: [produtoId],
        usuarioId,
      }),
    ]);
    assert.equal(tentativaSemEstoque[0]?.status, "rejected");
    const [pedidoFalho] = await dbTransacional.select({ id: checkoutPedidosTable.id })
      .from(checkoutPedidosTable)
      .where(eq(checkoutPedidosTable.chaveIdempotencia, `fluxo-real-${sufixo}-sem-estoque`));
    assert.equal(pedidoFalho, undefined, "pedido sem estoque foi persistido");
    const [carteiraAposFalha] = await dbTransacional.select().from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(carteiraAposFalha?.pontosDisponiveis, saldoInicial);
    assert.equal(carteiraAposFalha?.pontosReservados, "0.0000");
    const reservaFalha = await dbTransacional.query.reservasFidelidadeTable.findFirst({
      where: eq(reservasFidelidadeTable.clienteId, clienteId),
    });
    assert.equal(reservaFalha, undefined);
    const [varianteAntesDoPedido] = await dbTransacional.select({
      id: productVariantTable.id,
      estoque: productVariantTable.stockQuantity,
    }).from(productVariantTable).where(eq(productVariantTable.productId, produtoId));
    assert.ok(varianteAntesDoPedido);
    assert.equal(varianteAntesDoPedido.estoque, 10);

    const pedidoCriado = await criarPedidoCheckoutVisitanteInterno({
      dados: {
        nome: "Cliente Fluxo Real",
        email: `fluxo-real-${sufixo}@example.invalid`,
        telefone: "11999999999",
        documento: randomUUID(),
        cep: "30110000",
        rua: "Rua da Integração",
        numero: "100",
        bairro: "Centro",
        cidade: "Belo Horizonte",
        estado: "MG",
        pontosResgate: pontosSolicitados,
        formaPagamento: "pix",
        chaveIdempotencia: `fluxo-real-${sufixo}`,
        selecoesEntregaPorGrupo: [selecaoEntrega],
        itens: [itemCarrinho],
      },
      email: `fluxo-real-${sufixo}@example.invalid`,
      documento: (await dbTransacional.query.checkoutClientesTable.findFirst({
        where: eq(checkoutClientesTable.id, clienteId),
      }))!.documento,
      telefone: "11999999999",
      produtosIds: [produtoId],
      usuarioId,
    });
    pedidoId = pedidoCriado.pedidoId;

    const [pedidoPersistido] = await dbTransacional
      .select()
      .from(checkoutPedidosTable)
      .where(eq(checkoutPedidosTable.id, pedidoId));
    const [itemPersistido] = await dbTransacional
      .select()
      .from(checkoutPedidoItensTable)
      .where(eq(checkoutPedidoItensTable.pedidoId, pedidoId));
    const [reserva] = await dbTransacional
      .select()
      .from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pedidoId));
    assert.ok(pedidoPersistido && itemPersistido && reserva);

    const [alocacao] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
      .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoId));
    const [varianteAposPedido] = await dbTransacional.select({ estoque: productVariantTable.stockQuantity })
      .from(productVariantTable)
      .where(eq(productVariantTable.id, varianteAntesDoPedido.id));
    assert.equal(alocacao?.varianteId, varianteAntesDoPedido.id);
    assert.equal(alocacao?.quantidade, quantidade);
    assert.equal(alocacao?.status, "alocada");
    assert.equal(varianteAposPedido?.estoque, 8);

    assert.equal(
      pedidoPersistido.subtotalEmCentavos,
      previaPix.subtotalEmCentavos,
    );
    assert.equal(
      pedidoPersistido.descontoCupomEmCentavos,
      previaPix.descontoCupomEmCentavos,
    );
    assert.equal(
      pedidoPersistido.creditoFidelidadeEmCentavos,
      previa.fidelidade.creditoAplicadoEmCentavos,
    );
    assert.equal(pedidoPersistido.freteEmCentavos, previaPix.freteEmCentavos);
    const jurosPreviaEmCentavos =
      previaPix.totalEstimadoEmCentavos -
      (previaPix.subtotalEmCentavos -
        previaPix.descontoPromocionalEmCentavos -
        previaPix.descontoCupomEmCentavos +
        previaPix.freteEmCentavos -
        previa.fidelidade.creditoAplicadoEmCentavos);
    const jurosPedidoEmCentavos =
      pedidoPersistido.totalEmCentavos -
      (pedidoPersistido.subtotalEmCentavos -
        pedidoPersistido.descontoPromocionalEmCentavos -
        pedidoPersistido.descontoCupomEmCentavos +
        pedidoPersistido.freteEmCentavos -
        pedidoPersistido.creditoFidelidadeEmCentavos);
    assert.equal(jurosPreviaEmCentavos, 0);
    assert.equal(jurosPedidoEmCentavos, jurosPreviaEmCentavos);
    assert.equal(
      pedidoPersistido.totalEmCentavos,
      previaPix.totalEstimadoEmCentavos,
    );
    assert.equal(pedidoPersistido.pontosResgatados, pontosSolicitados);
    assert.equal(reserva.pontos, pontosSolicitados);
    assert.equal(reserva.creditoEmCentavos, creditoEsperadoEmCentavos);
    assert.equal(pedidoPersistido.reservaFidelidadeId, reserva.id);
    assert.equal(
      itemPersistido.creditoFidelidadeRateadoEmCentavos,
      creditoEsperadoEmCentavos,
    );

    let [carteira] = await dbTransacional
      .select()
      .from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(carteira?.pontosDisponiveis, "1500.0000");
    assert.equal(carteira?.pontosReservados, pontosSolicitados);
    assert.equal(reserva.status, "reservada");

    await dbTransacional
      .update(checkoutPedidosTable)
      .set({ status: "paid", pagamentoStatus: "paid" })
      .where(eq(checkoutPedidosTable.id, pedidoId));
    await dbTransacional
      .update(checkoutPagamentosTable)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(checkoutPagamentosTable.pedidoId, pedidoId));
    await dbTransacional.transaction((tx) =>
      processarEventoPedidoFidelidade(tx, pedidoId!, "pagamento_confirmado"),
    );
    await dbTransacional.transaction((tx) =>
      processarEventoPedidoFidelidade(tx, pedidoId!, "pagamento_confirmado"),
    );

    const [reservaConsumida] = await dbTransacional
      .select()
      .from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.id, reserva.id));
    [carteira] = await dbTransacional
      .select()
      .from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    const [consumos] = await dbTransacional
      .select({ total: sql<number>`count(*)::int` })
      .from(transacoesFidelidadeTable)
      .where(eq(transacoesFidelidadeTable.reservaId, reserva.id));
    assert.equal(reservaConsumida?.status, "consumida");
    assert.equal(carteira?.pontosReservados, "0.0000");
    assert.equal(carteira?.pontosUtilizados, pontosSolicitados);
    assert.equal(consumos?.total, 2);

    // Outro pedido real do mesmo cliente reserva pontos e estoque; o
    // cancelamento pré-expedição devolve ambos na mesma transação.
    const segundoPedido = await criarPedidoCheckoutVisitanteInterno({
      dados: {
        nome: "Cliente Fluxo Real",
        email: `fluxo-real-${sufixo}@example.invalid`,
        telefone: "11999999999",
        documento: randomUUID(),
        cep: "30110000",
        rua: "Rua da Integração",
        numero: "100",
        bairro: "Centro",
        cidade: "Belo Horizonte",
        estado: "MG",
        pontosResgate: pontosSolicitados,
        formaPagamento: "pix",
        chaveIdempotencia: `fluxo-real-${sufixo}-cancelamento`,
        selecoesEntregaPorGrupo: [selecaoEntrega],
        itens: [itemCarrinho],
      },
      email: `fluxo-real-${sufixo}@example.invalid`,
      documento: (await dbTransacional.query.checkoutClientesTable.findFirst({
        where: eq(checkoutClientesTable.id, clienteId),
      }))!.documento,
      telefone: "11999999999",
      produtosIds: [produtoId],
      usuarioId,
    });
    pedidoCanceladoId = segundoPedido.pedidoId;
    const [reservaCancelada] = await dbTransacional.select().from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pedidoCanceladoId));
    assert.equal(reservaCancelada?.status, "reservada");
    const [estoqueDuranteReserva] = await dbTransacional.select({ estoque: productVariantTable.stockQuantity })
      .from(productVariantTable)
      .where(eq(productVariantTable.id, varianteAntesDoPedido.id));
    assert.equal(estoqueDuranteReserva?.estoque, 6);
    [carteira] = await dbTransacional.select().from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(carteira?.pontosDisponiveis, "1000.0000");
    assert.equal(carteira?.pontosReservados, pontosSolicitados);

    const cancelamento = await dbTransacional.transaction(async (tx) => {
      await tx.update(checkoutPedidosTable).set({ status: "canceled" })
        .where(eq(checkoutPedidosTable.id, pedidoCanceladoId!));
      const estoque = await liberarAlocacoesEstoquePedido(tx, pedidoCanceladoId!);
      await processarEventoPedidoFidelidade(tx, pedidoCanceladoId!, "pedido_cancelado");
      return estoque;
    });
    const retryCancelamento = await dbTransacional.transaction(async (tx) => {
      const estoque = await liberarAlocacoesEstoquePedido(tx, pedidoCanceladoId!);
      await processarEventoPedidoFidelidade(tx, pedidoCanceladoId!, "pedido_cancelado");
      return estoque;
    });
    const [alocacaoCancelada] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
      .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoCanceladoId));
    const [reservaLiberada] = await dbTransacional.select().from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pedidoCanceladoId));
    const [estoqueAposCancelamento] = await dbTransacional.select({ estoque: productVariantTable.stockQuantity })
      .from(productVariantTable)
      .where(eq(productVariantTable.id, varianteAntesDoPedido.id));
    [carteira] = await dbTransacional.select().from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.deepEqual(cancelamento, { alocacoesLiberadas: 1, unidadesDevolvidas: 2 });
    assert.equal(retryCancelamento.unidadesDevolvidas, 0);
    assert.equal(alocacaoCancelada?.status, "liberada");
    assert.equal(reservaLiberada?.status, "liberada");
    assert.equal(estoqueAposCancelamento?.estoque, 8);
    assert.equal(carteira?.pontosDisponiveis, "1500.0000");
    assert.equal(carteira?.pontosReservados, "0.0000");

    async function criarPedidoAdicional(etiqueta: string, pontos: string) {
      const criado = await criarPedidoCheckoutVisitanteInterno({
        dados: {
          nome: "Cliente Fluxo Real",
          email: `fluxo-real-${sufixo}@example.invalid`,
          telefone: "11999999999",
          documento: randomUUID(),
          cep: "30110000",
          rua: "Rua da Integração",
          numero: "100",
          bairro: "Centro",
          cidade: "Belo Horizonte",
          estado: "MG",
          pontosResgate: pontos,
          formaPagamento: "pix",
          chaveIdempotencia: `fluxo-real-${sufixo}-${etiqueta}`,
          selecoesEntregaPorGrupo: [selecaoEntrega],
          itens: [itemCarrinho],
        },
        email: `fluxo-real-${sufixo}@example.invalid`,
        documento: (await dbTransacional.query.checkoutClientesTable.findFirst({
          where: eq(checkoutClientesTable.id, clienteId),
        }))!.documento,
        telefone: "11999999999",
        produtosIds: [produtoId],
        usuarioId,
      });
      pedidosExtrasIds.push(criado.pedidoId);
      return criado;
    }

    async function expirarPedidoComPontos(criado: { pedidoId: string; pagamentoId: string }) {
      return dbTransacional.transaction((tx) => expirarPagamentoPendente({
        tx,
        pedidoId: criado.pedidoId,
        pagamentoId: criado.pagamentoId,
        gateway: "efibank",
        referencia: `fluxo-real-${sufixo}:expiracao:${criado.pedidoId}`,
      }));
    }

    async function confirmarTardioComPontos(criado: { pedidoId: string; pagamentoId: string }) {
      return dbTransacional.transaction(async (tx) => {
        await tx.update(checkoutPagamentosTable)
          .set({ status: "paid", paidAt: new Date() })
          .where(eq(checkoutPagamentosTable.id, criado.pagamentoId));
        const resultado = await confirmarPagamentoRecebido(tx, criado.pedidoId);
        if (resultado.recursos === "prontos") {
          await processarEventoPedidoFidelidade(tx, criado.pedidoId, "pagamento_confirmado");
        }
        return resultado;
      });
    }

    const pedidoTardioDisponivel = await criarPedidoAdicional("tardio-disponivel", pontosSolicitados);
    assert.equal((await expirarPedidoComPontos(pedidoTardioDisponivel)).expiradoAgora, true);
    assert.equal((await expirarPedidoComPontos(pedidoTardioDisponivel)).expiradoAgora, false);
    const [reservaExpirada] = await dbTransacional.select().from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pedidoTardioDisponivel.pedidoId));
    const [alocacaoExpirada] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
      .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoTardioDisponivel.pedidoId));
    assert.equal(reservaExpirada?.status, "liberada");
    assert.equal(alocacaoExpirada?.status, "liberada");
    const [estoqueExpirado] = await dbTransacional.select({ estoque: productVariantTable.stockQuantity })
      .from(productVariantTable).where(eq(productVariantTable.id, varianteAntesDoPedido.id));
    assert.equal(estoqueExpirado?.estoque, 8);
    [carteira] = await dbTransacional.select().from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(carteira?.pontosDisponiveis, "1500.0000");
    assert.equal(carteira?.pontosReservados, "0.0000");

    const tardioDisponivel = await confirmarTardioComPontos(pedidoTardioDisponivel);
    const retryTardioDisponivel = await dbTransacional.transaction(async (tx) => {
      const retorno = await confirmarPagamentoRecebido(tx, pedidoTardioDisponivel.pedidoId);
      await processarEventoPedidoFidelidade(tx, pedidoTardioDisponivel.pedidoId, "pagamento_confirmado");
      return retorno;
    });
    const [reservaReobtida] = await dbTransacional.select().from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pedidoTardioDisponivel.pedidoId));
    const [alocacaoReobtida] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
      .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoTardioDisponivel.pedidoId));
    assert.equal(tardioDisponivel.recursos, "prontos");
    assert.equal(retryTardioDisponivel.recursos, "prontos");
    assert.equal(reservaReobtida?.status, "consumida");
    assert.equal(alocacaoReobtida?.status, "alocada");
    [carteira] = await dbTransacional.select().from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(carteira?.pontosDisponiveis, "1000.0000");
    assert.equal(carteira?.pontosReservados, "0.0000");
    assert.equal(carteira?.pontosUtilizados, "1000.0000");

    const pedidoTardioSemPontos = await criarPedidoAdicional("tardio-sem-pontos", pontosSolicitados);
    await expirarPedidoComPontos(pedidoTardioSemPontos);
    const pedidoConcorrentePontos = await criarPedidoAdicional("pontos-concorrentes", "1000.0000");
    const [estoqueAntesDaFalhaPontos] = await dbTransacional.select({ estoque: productVariantTable.stockQuantity })
      .from(productVariantTable).where(eq(productVariantTable.id, varianteAntesDoPedido.id));
    const tardioSemPontos = await confirmarTardioComPontos(pedidoTardioSemPontos);
    const [estoqueAposFalhaPontos] = await dbTransacional.select({ estoque: productVariantTable.stockQuantity })
      .from(productVariantTable).where(eq(productVariantTable.id, varianteAntesDoPedido.id));
    const [reservaAindaLiberada] = await dbTransacional.select().from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pedidoTardioSemPontos.pedidoId));
    const [alocacaoAindaLiberada] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
      .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoTardioSemPontos.pedidoId));
    const [pedidoPagoBloqueado] = await dbTransacional.select().from(checkoutPedidosTable)
      .where(eq(checkoutPedidosTable.id, pedidoTardioSemPontos.pedidoId));
    const [reservaConcorrente] = await dbTransacional.select().from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pedidoConcorrentePontos.pedidoId));
    assert.equal(tardioSemPontos.recursos, "indisponiveis");
    assert.equal(pedidoPagoBloqueado?.pagamentoStatus, "paid");
    assert.equal(pedidoPagoBloqueado?.status, "pagamento_recebido_sem_recursos");
    assert.equal(estoqueAposFalhaPontos?.estoque, estoqueAntesDaFalhaPontos?.estoque);
    assert.equal(reservaAindaLiberada?.status, "liberada");
    assert.equal(alocacaoAindaLiberada?.status, "liberada");
    assert.equal(reservaConcorrente?.status, "reservada");
    [carteira] = await dbTransacional.select().from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(carteira?.pontosDisponiveis, "0.0000");
    assert.equal(carteira?.pontosReservados, "1000.0000");

    console.log("[fidelidade:fluxo-real-checkout]", {
      subtotalEmCentavos: previaPix.subtotalEmCentavos,
      descontoCupomEmCentavos: previaPix.descontoCupomEmCentavos,
      creditoFidelidadeEmCentavos: previa.fidelidade.creditoAplicadoEmCentavos,
      freteEmCentavos: previaPix.freteEmCentavos,
      jurosEmCentavos: jurosPedidoEmCentavos,
      totalEmCentavos: previaPix.totalEstimadoEmCentavos,
      pontosSolicitados,
      saldoInicial,
      saldoAposReserva: "1500.0000",
      reservaAposPagamento: reservaConsumida?.status,
      consumoRepetido: "não duplicado",
    });
  } finally {
    await limparFixtures();
    await encerrarBancoTransacionalIntegracao();
  }
}

export const execucao = executar();
