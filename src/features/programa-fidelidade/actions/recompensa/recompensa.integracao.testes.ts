import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";

import {
  carteirasFidelidadeTable,
  categoryTable,
  checkoutClientesTable,
  checkoutEnderecosTable,
  checkoutEstoqueAlocacoesTable,
  checkoutPagamentosTable,
  checkoutPedidoItensTable,
  checkoutPedidosTable,
  cities,
  marcaTable,
  modelosRetiradaTable,
  processamentosPedidosFidelidadeTable,
  productOwnDeliveryPrices,
  productPricingTable,
  productTable,
  productVariantTable,
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
import { calcularResumoCheckout } from "@/features/checkout/queries/resumo-checkout/calcular-resumo-checkout";
import { processarEventoPedidoFidelidade } from "@/features/programa-fidelidade/lib/processar-evento-pedido-fidelidade";
import {
  buscarRecompensaPublicaPorSlug,
  listarRecompensasPublicas,
} from "@/features/programa-fidelidade/queries/catalogo/listar-recompensas-publicas";
import { calcularPreviaRecompensaInterno } from "@/features/programa-fidelidade/queries/previa-recompensa/calcular-previa-recompensa-interno";

import {
  confirmarRecompensaSemCobrancaInterno,
  criarPedidoRecompensaInterno,
} from "./criar-pedido-recompensa";

const sufixo = randomUUID();
const usuarioId = `it-recompensa-${sufixo}`;
const clienteId = randomUUID();
const carteiraId = randomUUID();
const categoriaId = randomUUID();
const marcaId = randomUUID();
const modeloRetiradaId = randomUUID();
const produtoId = randomUUID();
const produtoNormalId = randomUUID();
const custoPontos = 2500;
const saldoInicial = "5000.0000";
const pedidosIds: string[] = [];

const item = {
  id: `item-recompensa-${sufixo}`,
  produtoId,
  nome: "Produto recompensa",
  sku: `SKU-${sufixo}`,
  modalidadeTipo: "stock",
  modalidadeTitulo: "Pronta entrega",
  imagemUrl: "https://example.invalid/recompensa.png",
  precoEmCentavos: 30000,
  quantidade: 1,
  freteEscolhido: {
    id: "retirada" as const,
    nome: "Retirada integração",
    prazo: "Disponível imediatamente",
    valorEmCentavos: 0,
    cep: "30110000",
  },
};

async function preparar() {
  await dbTransacional.insert(userTable).values({
    id: usuarioId,
    name: "Cliente Recompensa",
    email: `recompensa-${sufixo}@example.invalid`,
    emailVerified: true,
  });
  await dbTransacional.insert(checkoutClientesTable).values({
    id: clienteId,
    userId: usuarioId,
    nome: "Cliente Recompensa",
    email: `recompensa-${sufixo}@example.invalid`,
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
    name: "Categoria recompensa",
    slug: `categoria-recompensa-${sufixo}`,
  });
  await dbTransacional.insert(marcaTable).values({
    id: marcaId,
    nome: "Marca recompensa",
    slug: `marca-recompensa-${sufixo}`,
  });
  await dbTransacional.insert(modelosRetiradaTable).values({
    id: modeloRetiradaId,
    nome: "Retirada recompensa",
    prazoTexto: "Disponível imediatamente",
    ativo: true,
  });
  await dbTransacional.insert(productTable).values({
    id: produtoId,
    categoryId: categoriaId,
    marcaId,
    name: "Produto recompensa",
    slug: `produto-recompensa-${sufixo}`,
    description: "Fixture isolada.",
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
    recompensaPontosAtiva: true,
    recompensaCustoPontos: custoPontos,
  });
  await dbTransacional.insert(productPricingTable).values({
    productId: produtoId,
    type: "stock",
    pricingModalDescription: "1 dia",
    price: 30000,
    mainCardPrice: true,
    isActive: true,
  });
  await dbTransacional.insert(productVariantTable).values({
    productId: produtoId,
    sku: `SKU-${sufixo}`,
    name: "Variante técnica",
    attributes: {},
    priceInCents: 30000,
    stockQuantity: 10,
    isActive: true,
    isDefault: true,
  });
  await dbTransacional.insert(productTable).values({
    id: produtoNormalId,
    categoryId: categoriaId,
    marcaId,
    name: "Produto normal",
    slug: `produto-normal-recompensa-${sufixo}`,
    description: "Não é recompensa.",
    sku: `SKU-normal-${sufixo}`,
    status: "published",
    productKind: "simple",
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
    productId: produtoNormalId,
    type: "stock",
    price: 30000,
    mainCardPrice: true,
    isActive: true,
  });
  await dbTransacional.insert(productVariantTable).values({
    productId: produtoNormalId,
    sku: `SKU-normal-${sufixo}`,
    name: "Variante técnica normal",
    attributes: {},
    priceInCents: 30000,
    stockQuantity: 10,
    isActive: true,
    isDefault: true,
  });
}

async function limpar() {
  for (const pedidoId of pedidosIds) {
    await dbTransacional
      .delete(checkoutEstoqueAlocacoesTable)
      .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoId));
    await dbTransacional
      .delete(transacoesFidelidadeTable)
      .where(eq(transacoesFidelidadeTable.pedidoId, pedidoId));
    await dbTransacional
      .delete(processamentosPedidosFidelidadeTable)
      .where(eq(processamentosPedidosFidelidadeTable.pedidoId, pedidoId));
    await dbTransacional
      .delete(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pedidoId));
    await dbTransacional
      .delete(checkoutPedidosTable)
      .where(eq(checkoutPedidosTable.id, pedidoId));
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
    .delete(productTable)
    .where(eq(productTable.id, produtoNormalId));
  await dbTransacional
    .delete(modelosRetiradaTable)
    .where(eq(modelosRetiradaTable.id, modeloRetiradaId));
  await dbTransacional.delete(marcaTable).where(eq(marcaTable.id, marcaId));
  await dbTransacional
    .delete(categoryTable)
    .where(eq(categoryTable.id, categoriaId));
}

async function dadosPedido(
  chave: string,
  tipoEntrega: "retirada" | "entrega" = "retirada",
  itemCarrinho: typeof item = item,
) {
  const resumo = await calcularResumoCheckout({
    itens: [itemCarrinho],
    cepEntrega: "30110000",
  });
  const grupo = resumo?.cotacoesEntrega[0];
  const retirada = grupo?.opcoes.find(
    (opcao) =>
      opcao.tipo === tipoEntrega &&
      (tipoEntrega === "retirada" || opcao.provedor === "entrega-propria"),
  );
  assert.ok(
    grupo && retirada,
    `entrega ${tipoEntrega} não foi disponibilizada`,
  );
  return {
    nome: "Cliente Recompensa",
    email: `recompensa-${sufixo}@example.invalid`,
    telefone: "11999999999",
    documento: randomUUID(),
    cep: "30110000",
    rua: "Rua da Integração",
    numero: "100",
    bairro: "Centro",
    cidade: "Belo Horizonte",
    estado: "MG",
    formaPagamento: "pix" as const,
    chaveIdempotencia: chave,
    selecoesEntregaPorGrupo: [
      {
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
      },
    ],
    itens: [itemCarrinho],
  };
}

async function executar() {
  try {
    await preparar();
    const catalogo = await listarRecompensasPublicas();
    assert.ok(
      catalogo.recompensas.some(
        (produto) =>
          produto.id === produtoId && produto.custoPontos === custoPontos,
      ),
    );
    assert.equal(
      catalogo.recompensas.some((produto) => produto.id === produtoNormalId),
      false,
    );
    assert.ok(
      await buscarRecompensaPublicaPorSlug(`produto-recompensa-${sufixo}`),
    );
    assert.equal(
      await buscarRecompensaPublicaPorSlug(
        `produto-normal-recompensa-${sufixo}`,
      ),
      null,
    );
    const dados = await dadosPedido(`recompensa-${sufixo}`);
    const entradaPrevia = {
      item: dados.itens[0],
      cep: dados.cep,
      cidade: dados.cidade,
      estado: dados.estado,
      selecoesEntregaPorGrupo: dados.selecoesEntregaPorGrupo,
    };
    const resumoCheckoutNormal = await calcularResumoCheckout({
      itens: [item],
      cepEntrega: dados.cep,
    });
    assert.ok(
      (resumoCheckoutNormal?.totaisPorFormaPagamento.pix.subtotalEmCentavos ??
        0) > 0,
    );
    const [carteiraAntesPrevia] = await dbTransacional
      .select()
      .from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    const [varianteAntesPrevia] = await dbTransacional
      .select()
      .from(productVariantTable)
      .where(eq(productVariantTable.productId, produtoId));
    const previaGratis = await calcularPreviaRecompensaInterno({
      entrada: entradaPrevia,
      usuarioId,
    });
    assert.equal(previaGratis.custoPontos, custoPontos);
    assert.equal(previaGratis.quantidade, 1);
    assert.equal(previaGratis.saldoDisponivel, 5000);
    assert.equal(previaGratis.saldoAposResgate, 2500);
    assert.equal(previaGratis.freteEmCentavos, 0);
    assert.equal(previaGratis.totalMonetarioEmCentavos, 0);
    assert.equal(previaGratis.podeResgatar, true);
    await assert.rejects(
      calcularPreviaRecompensaInterno({
        entrada: { ...entradaPrevia, item: { ...item, quantidade: 2 } },
        usuarioId,
      }),
      /quantidade 1/,
    );
    await dbTransacional
      .update(productTable)
      .set({ recompensaPontosAtiva: false })
      .where(eq(productTable.id, produtoId));
    await assert.rejects(
      calcularPreviaRecompensaInterno({ entrada: entradaPrevia, usuarioId }),
      /PRODUTO_NAO_ELEGIVEL_RECOMPENSA/,
    );
    await dbTransacional
      .update(productTable)
      .set({ recompensaPontosAtiva: true, recompensaCustoPontos: 3000 })
      .where(eq(productTable.id, produtoId));
    const previaNovoCusto = await calcularPreviaRecompensaInterno({
      entrada: entradaPrevia,
      usuarioId,
    });
    assert.equal(
      previaNovoCusto.custoPontos,
      3000,
      "o custo deve vir do produto atual no servidor",
    );
    await dbTransacional
      .update(productTable)
      .set({ recompensaCustoPontos: custoPontos })
      .where(eq(productTable.id, produtoId));
    await dbTransacional
      .update(productPricingTable)
      .set({ price: 50000 })
      .where(eq(productPricingTable.productId, produtoId));
    const previaPrecoAlterado = await calcularPreviaRecompensaInterno({
      entrada: entradaPrevia,
      usuarioId,
    });
    assert.equal(
      previaPrecoAlterado.totalMonetarioEmCentavos,
      0,
      "o preço normal atualizado também não entra no total da recompensa",
    );
    await dbTransacional
      .update(productPricingTable)
      .set({ price: 30000 })
      .where(eq(productPricingTable.productId, produtoId));
    await dbTransacional
      .update(carteirasFidelidadeTable)
      .set({ pontosDisponiveis: "2000.0000" })
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    const previaInsuficiente = await calcularPreviaRecompensaInterno({
      entrada: entradaPrevia,
      usuarioId,
    });
    assert.equal(previaInsuficiente.podeResgatar, false);
    assert.equal(previaInsuficiente.pontosFaltantes, 500);
    assert.equal(previaInsuficiente.saldoAposResgate, null);
    await dbTransacional
      .update(carteirasFidelidadeTable)
      .set({ pontosDisponiveis: saldoInicial })
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    const [carteiraDepoisPrevia] = await dbTransacional
      .select()
      .from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    const [varianteDepoisPrevia] = await dbTransacional
      .select()
      .from(productVariantTable)
      .where(eq(productVariantTable.productId, produtoId));
    assert.equal(
      carteiraDepoisPrevia?.pontosDisponiveis,
      carteiraAntesPrevia?.pontosDisponiveis,
    );
    assert.equal(
      carteiraDepoisPrevia?.pontosReservados,
      carteiraAntesPrevia?.pontosReservados,
    );
    assert.equal(
      varianteDepoisPrevia?.stockQuantity,
      varianteAntesPrevia?.stockQuantity,
    );
    assert.equal(
      (
        await dbTransacional
          .select()
          .from(checkoutPedidosTable)
          .where(eq(checkoutPedidosTable.clienteId, clienteId))
      ).length,
      0,
    );
    assert.equal(
      (
        await dbTransacional
          .select()
          .from(reservasFidelidadeTable)
          .where(eq(reservasFidelidadeTable.clienteId, clienteId))
      ).length,
      0,
    );
    assert.equal(
      (
        await dbTransacional
          .select()
          .from(transacoesFidelidadeTable)
          .where(eq(transacoesFidelidadeTable.carteiraId, carteiraId))
      ).length,
      0,
    );
    await assert.rejects(
      criarPedidoRecompensaInterno({
        dados: { ...dados, itens: [{ ...item, quantidade: 2 }] },
        usuarioId,
      }),
      /RECOMPENSA_EXIGE_QUANTIDADE_UM/,
    );
    await assert.rejects(
      criarPedidoRecompensaInterno({
        dados: { ...dados, itens: [item, { ...item, id: `${item.id}-2` }] },
        usuarioId,
      }),
      /RECOMPENSA_EXIGE_PRODUTO_UNICO/,
    );
    await dbTransacional
      .update(productTable)
      .set({ recompensaPontosAtiva: false })
      .where(eq(productTable.id, produtoId));
    await assert.rejects(
      criarPedidoRecompensaInterno({ dados, usuarioId }),
      /PRODUTO_NAO_ELEGIVEL_RECOMPENSA/,
    );
    await dbTransacional
      .update(productTable)
      .set({ recompensaPontosAtiva: true })
      .where(eq(productTable.id, produtoId));
    const dadosManipulados = { ...dados, recompensaCustoPontos: 1 };
    const criado = await criarPedidoRecompensaInterno({
      dados: dadosManipulados,
      usuarioId,
    });
    pedidosIds.push(criado.pedidoId);
    assert.equal(criado.totalEmCentavos, 0);
    const [pedido] = await dbTransacional
      .select()
      .from(checkoutPedidosTable)
      .where(eq(checkoutPedidosTable.id, criado.pedidoId));
    const [pagamento] = await dbTransacional
      .select()
      .from(checkoutPagamentosTable)
      .where(eq(checkoutPagamentosTable.pedidoId, criado.pedidoId));
    const [itemPedido] = await dbTransacional
      .select()
      .from(checkoutPedidoItensTable)
      .where(eq(checkoutPedidoItensTable.pedidoId, criado.pedidoId));
    const [reserva] = await dbTransacional
      .select()
      .from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, criado.pedidoId));
    const [carteira] = await dbTransacional
      .select()
      .from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(pedido?.modalidadePedido, "recompensa");
    assert.equal(pedido?.recompensaCustoPontosSnapshot, custoPontos);
    assert.equal(pedido?.subtotalEmCentavos, 0);
    assert.equal(pedido?.totalEmCentavos, 0);
    assert.equal(itemPedido?.quantidade, 1);
    assert.equal(itemPedido?.totalEmCentavos, 0);
    assert.equal(itemPedido?.modalidade, "stock");
    assert.equal(pagamento?.gateway, "interno");
    assert.equal(pagamento?.metodo, "pontos");
    assert.equal(pagamento?.valorEmCentavos, 0);
    assert.equal(pagamento?.status, "paid");
    assert.equal(reserva?.modalidade, "recompensa");
    assert.equal(reserva?.pontos, `${custoPontos}.0000`);
    assert.equal(reserva?.status, "consumida");
    assert.equal(carteira?.pontosDisponiveis, "2500.0000");
    assert.equal(carteira?.pontosReservados, "0.0000");
    assert.equal(carteira?.pontosUtilizados, "2500.0000");
    const repetido = await criarPedidoRecompensaInterno({ dados, usuarioId });
    assert.equal(repetido.jaExistia, true);
    assert.equal(repetido.pedidoId, criado.pedidoId);
    const confirmacaoRepetida = await dbTransacional.transaction((tx) =>
      confirmarRecompensaSemCobrancaInterno(tx, criado.pedidoId),
    );
    assert.equal(confirmacaoRepetida.confirmadoAgora, false);
    await dbTransacional
      .update(productTable)
      .set({ recompensaCustoPontos: 3000 })
      .where(eq(productTable.id, produtoId));
    const [snapshot] = await dbTransacional
      .select()
      .from(checkoutPedidosTable)
      .where(eq(checkoutPedidosTable.id, criado.pedidoId));
    assert.equal(snapshot?.recompensaCustoPontosSnapshot, custoPontos);
    await dbTransacional.transaction(async (tx) => {
      await tx
        .update(checkoutPedidosTable)
        .set({ status: "canceled" })
        .where(eq(checkoutPedidosTable.id, criado.pedidoId));
      await liberarAlocacoesEstoquePedido(tx, criado.pedidoId);
      await processarEventoPedidoFidelidade(
        tx,
        criado.pedidoId,
        "pedido_cancelado",
      );
    });
    const [reservaDevolvida] = await dbTransacional
      .select()
      .from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, criado.pedidoId));
    const [carteiraDevolvida] = await dbTransacional
      .select()
      .from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(reservaDevolvida?.status, "devolvida");
    assert.equal(carteiraDevolvida?.pontosDisponiveis, saldoInicial);
    const [varianteAposCancelamentoPago] = await dbTransacional
      .select()
      .from(productVariantTable)
      .where(eq(productVariantTable.productId, produtoId));
    assert.equal(varianteAposCancelamentoPago?.stockQuantity, 10);
    await assert.rejects(
      dbTransacional
        .update(productTable)
        .set({ recompensaCustoPontos: 0 })
        .where(eq(productTable.id, produtoId)),
      /Failed query/,
    );
    await assert.rejects(
      dbTransacional
        .update(productTable)
        .set({ recompensaCustoPontos: null })
        .where(eq(productTable.id, produtoId)),
      /Failed query/,
    );
    const concorrentes = await Promise.allSettled([
      criarPedidoRecompensaInterno({
        dados: {
          ...dados,
          chaveIdempotencia: `recompensa-concorrente-a-${sufixo}`,
        },
        usuarioId,
      }),
      criarPedidoRecompensaInterno({
        dados: {
          ...dados,
          chaveIdempotencia: `recompensa-concorrente-b-${sufixo}`,
        },
        usuarioId,
      }),
    ]);
    const aprovados = concorrentes.filter(
      (resultado) => resultado.status === "fulfilled",
    );
    const negados = concorrentes.filter(
      (resultado) => resultado.status === "rejected",
    );
    assert.equal(
      aprovados.length,
      1,
      "concorrência criou mais de uma recompensa sem saldo",
    );
    assert.equal(negados.length, 1);
    assert.ok(negados[0]?.status === "rejected");
    assert.match(String(negados[0].reason), /SALDO_FIDELIDADE_CONCORRENTE/);
    const concorrenteCriado = aprovados[0];
    assert.ok(concorrenteCriado?.status === "fulfilled");
    pedidosIds.push(concorrenteCriado.value.pedidoId);
    const [carteiraConcorrente] = await dbTransacional
      .select()
      .from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(carteiraConcorrente?.pontosDisponiveis, "2000.0000");
    await dbTransacional.transaction(async (tx) => {
      await tx
        .update(checkoutPedidosTable)
        .set({ status: "canceled" })
        .where(eq(checkoutPedidosTable.id, concorrenteCriado.value.pedidoId));
      await liberarAlocacoesEstoquePedido(tx, concorrenteCriado.value.pedidoId);
      await processarEventoPedidoFidelidade(
        tx,
        concorrenteCriado.value.pedidoId,
        "pedido_cancelado",
      );
    });
    const pontosGerados = await dbTransacional
      .select({ tipo: transacoesFidelidadeTable.tipo })
      .from(transacoesFidelidadeTable)
      .where(eq(transacoesFidelidadeTable.pedidoId, criado.pedidoId));
    assert.equal(
      pontosGerados.some((transacao) => transacao.tipo === "credito_pendente"),
      false,
    );
    assert.deepEqual(
      pontosGerados.map((transacao) => transacao.tipo).sort(),
      ["consumo_resgate", "devolucao_resgate", "reserva_resgate"].sort(),
    );
    const normaisGratuitos = await dbTransacional.execute<{ total: number }>(
      sql`select count(*)::int as total from checkout_pedidos where modalidade_pedido = 'compra' and total_em_centavos = 0`,
    );
    assert.equal(normaisGratuitos.rows[0]?.total, 0);

    await dbTransacional
      .update(productTable)
      .set({
        recompensaCustoPontos: custoPontos,
        allowsOwnDelivery: true,
      })
      .where(eq(productTable.id, produtoId));
    const cidadeEntrega = await dbTransacional.query.cities.findFirst({
      where: and(eq(cities.name, "Belo Horizonte"), eq(cities.stateUf, "MG")),
    });
    assert.ok(cidadeEntrega, "Belo Horizonte/MG precisa existir na base local");
    await dbTransacional.insert(productOwnDeliveryPrices).values({
      productId: produtoId,
      destinationType: "cidade",
      cityId: cidadeEntrega.id,
      shippingPrice: 1800,
      rapidDeliveryActive: true,
      isActive: true,
    });
    const dadosFrete = await dadosPedido(
      `recompensa-frete-${sufixo}`,
      "entrega",
    );
    const previaComFrete = await calcularPreviaRecompensaInterno({
      entrada: {
        item: dadosFrete.itens[0],
        cep: dadosFrete.cep,
        cidade: dadosFrete.cidade,
        estado: dadosFrete.estado,
        selecoesEntregaPorGrupo: dadosFrete.selecoesEntregaPorGrupo,
      },
      usuarioId,
    });
    assert.equal(previaComFrete.custoPontos, custoPontos);
    assert.equal(previaComFrete.saldoDisponivel, 5000);
    assert.equal(previaComFrete.freteEmCentavos, 1800);
    assert.equal(previaComFrete.totalMonetarioEmCentavos, 1800);
    assert.notEqual(
      previaComFrete.totalMonetarioEmCentavos,
      item.precoEmCentavos + 1800,
    );
    const pendente = await criarPedidoRecompensaInterno({
      dados: dadosFrete,
      usuarioId,
    });
    pedidosIds.push(pendente.pedidoId);
    assert.ok(
      pendente.totalEmCentavos > 0,
      "frete da recompensa deve ser cobrado em dinheiro",
    );
    const [pedidoPendente] = await dbTransacional
      .select()
      .from(checkoutPedidosTable)
      .where(eq(checkoutPedidosTable.id, pendente.pedidoId));
    const [pagamentoPendente] = await dbTransacional
      .select()
      .from(checkoutPagamentosTable)
      .where(eq(checkoutPagamentosTable.pedidoId, pendente.pedidoId));
    const [reservaPendente] = await dbTransacional
      .select()
      .from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pendente.pedidoId));
    assert.equal(pedidoPendente?.subtotalEmCentavos, 0);
    assert.equal(pedidoPendente?.freteEmCentavos, pendente.totalEmCentavos);
    assert.equal(
      pedidoPendente?.totalEmCentavos,
      previaComFrete.totalMonetarioEmCentavos,
    );
    assert.equal(pagamentoPendente?.valorEmCentavos, pendente.totalEmCentavos);
    assert.equal(pagamentoPendente?.gateway, "efibank");
    assert.equal(pagamentoPendente?.status, "pending");
    assert.equal(reservaPendente?.status, "reservada");
    await dbTransacional.transaction(async (tx) => {
      await tx
        .update(checkoutPedidosTable)
        .set({ status: "canceled" })
        .where(eq(checkoutPedidosTable.id, pendente.pedidoId));
      await liberarAlocacoesEstoquePedido(tx, pendente.pedidoId);
      await processarEventoPedidoFidelidade(
        tx,
        pendente.pedidoId,
        "pedido_cancelado",
      );
    });
    const [reservaLiberada] = await dbTransacional
      .select()
      .from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pendente.pedidoId));
    assert.equal(reservaLiberada?.status, "liberada");
    const [alocacaoLiberada] = await dbTransacional
      .select()
      .from(checkoutEstoqueAlocacoesTable)
      .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pendente.pedidoId));
    assert.equal(alocacaoLiberada?.status, "liberada");
    const [varianteAposCancelamentoPendente] = await dbTransacional
      .select()
      .from(productVariantTable)
      .where(eq(productVariantTable.productId, produtoId));
    assert.equal(varianteAposCancelamentoPendente?.stockQuantity, 10);
    const [carteiraAposLiberacao] = await dbTransacional
      .select()
      .from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(carteiraAposLiberacao?.pontosDisponiveis, saldoInicial);

    const dadosFretePago = {
      ...dadosFrete,
      chaveIdempotencia: `recompensa-frete-pago-${sufixo}`,
    };
    const pago = await criarPedidoRecompensaInterno({
      dados: dadosFretePago,
      usuarioId,
    });
    pedidosIds.push(pago.pedidoId);
    await dbTransacional.transaction(async (tx) => {
      await tx
        .update(checkoutPagamentosTable)
        .set({ status: "paid", paidAt: new Date() })
        .where(eq(checkoutPagamentosTable.pedidoId, pago.pedidoId));
      const confirmado = await confirmarPagamentoRecebido(tx, pago.pedidoId);
      assert.equal(confirmado.recursos, "prontos");
      await processarEventoPedidoFidelidade(
        tx,
        pago.pedidoId,
        "pagamento_confirmado",
      );
    });
    const [reservaPaga] = await dbTransacional
      .select()
      .from(reservasFidelidadeTable)
      .where(eq(reservasFidelidadeTable.pedidoId, pago.pedidoId));
    assert.equal(reservaPaga?.status, "consumida");
    const [alocacaoAposPagamento] = await dbTransacional
      .select()
      .from(checkoutEstoqueAlocacoesTable)
      .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pago.pedidoId));
    assert.equal(alocacaoAposPagamento?.status, "alocada");
    const creditoGeradoNaRecompensaPaga = await dbTransacional
      .select({ tipo: transacoesFidelidadeTable.tipo })
      .from(transacoesFidelidadeTable)
      .where(eq(transacoesFidelidadeTable.pedidoId, pago.pedidoId));
    assert.equal(
      creditoGeradoNaRecompensaPaga.some(
        (transacao) => transacao.tipo === "credito_pendente",
      ),
      false,
    );
    const [carteiraAposPagamento] = await dbTransacional
      .select()
      .from(carteirasFidelidadeTable)
      .where(eq(carteirasFidelidadeTable.id, carteiraId));
    assert.equal(carteiraAposPagamento?.pontosDisponiveis, "2500.0000");
    assert.equal(carteiraAposPagamento?.pontosReservados, "0.0000");

    // Há saldo para duas recompensas de 1.200 pontos, mas apenas uma unidade local.
    await dbTransacional
      .update(productTable)
      .set({ recompensaCustoPontos: 1200 })
      .where(eq(productTable.id, produtoId));
    await dbTransacional
      .update(productVariantTable)
      .set({ stockQuantity: 1 })
      .where(eq(productVariantTable.productId, produtoId));
    const concorrenciaEstoque = await Promise.allSettled([
      criarPedidoRecompensaInterno({
        dados: { ...dados, chaveIdempotencia: `recompensa-ultima-a-${sufixo}` },
        usuarioId,
      }),
      criarPedidoRecompensaInterno({
        dados: { ...dados, chaveIdempotencia: `recompensa-ultima-b-${sufixo}` },
        usuarioId,
      }),
    ]);
    const vencedoresEstoque = concorrenciaEstoque.filter(
      (resultado) => resultado.status === "fulfilled",
    );
    assert.equal(
      vencedoresEstoque.length,
      1,
      "a última unidade foi vendida duas vezes",
    );
    const vencedorEstoque = vencedoresEstoque[0];
    assert.ok(vencedorEstoque?.status === "fulfilled");
    pedidosIds.push(vencedorEstoque.value.pedidoId);
    const [varianteAposConcorrencia] = await dbTransacional
      .select()
      .from(productVariantTable)
      .where(eq(productVariantTable.productId, produtoId));
    assert.equal(varianteAposConcorrencia?.stockQuantity, 0);
    await assert.rejects(
      calcularPreviaRecompensaInterno({ entrada: entradaPrevia, usuarioId }),
      /Estoque insuficiente/,
    );
    const [alocacaoVencedora] = await dbTransacional
      .select()
      .from(checkoutEstoqueAlocacoesTable)
      .where(
        eq(
          checkoutEstoqueAlocacoesTable.pedidoId,
          vencedorEstoque.value.pedidoId,
        ),
      );
    assert.equal(alocacaoVencedora?.status, "alocada");
    await dbTransacional.transaction(async (tx) => {
      await tx
        .update(checkoutPedidosTable)
        .set({ status: "canceled" })
        .where(eq(checkoutPedidosTable.id, vencedorEstoque.value.pedidoId));
      await liberarAlocacoesEstoquePedido(tx, vencedorEstoque.value.pedidoId);
      await processarEventoPedidoFidelidade(
        tx,
        vencedorEstoque.value.pedidoId,
        "pedido_cancelado",
      );
    });
    const [varianteDevolvida] = await dbTransacional
      .select()
      .from(productVariantTable)
      .where(eq(productVariantTable.productId, produtoId));
    assert.equal(varianteDevolvida?.stockQuantity, 1);

    // Pré-venda, dropshipping e sob encomenda não exigem estoque local no checkout.
    await dbTransacional.insert(productPricingTable).values([
      { productId: produtoId, type: "pre_sale", price: 30000, isActive: true },
      {
        productId: produtoId,
        type: "dropshipping",
        price: 30000,
        isActive: true,
      },
      {
        productId: produtoId,
        type: "order_basis",
        price: 30000,
        isActive: true,
      },
    ]);
    await dbTransacional
      .update(productVariantTable)
      .set({ stockQuantity: 0 })
      .where(eq(productVariantTable.productId, produtoId));
    for (const modalidade of ["pre_sale", "dropshipping", "order_basis"]) {
      const dadosModalidade = await dadosPedido(
        `recompensa-${modalidade}-${sufixo}`,
        "retirada",
        { ...item, modalidadeTipo: modalidade },
      );
      const semEstoqueLocal = await criarPedidoRecompensaInterno({
        dados: dadosModalidade,
        usuarioId,
      });
      pedidosIds.push(semEstoqueLocal.pedidoId);
      const [variante] = await dbTransacional
        .select()
        .from(productVariantTable)
        .where(eq(productVariantTable.productId, produtoId));
      const alocacoes = await dbTransacional
        .select()
        .from(checkoutEstoqueAlocacoesTable)
        .where(
          eq(checkoutEstoqueAlocacoesTable.pedidoId, semEstoqueLocal.pedidoId),
        );
      assert.equal(
        variante?.stockQuantity,
        0,
        `${modalidade} debitou estoque local`,
      );
      assert.equal(alocacoes.length, 0, `${modalidade} criou alocação local`);
      await dbTransacional.transaction(async (tx) => {
        await tx
          .update(checkoutPedidosTable)
          .set({ status: "canceled" })
          .where(eq(checkoutPedidosTable.id, semEstoqueLocal.pedidoId));
        const liberacao = await liberarAlocacoesEstoquePedido(
          tx,
          semEstoqueLocal.pedidoId,
        );
        assert.equal(liberacao.unidadesDevolvidas, 0);
        await processarEventoPedidoFidelidade(
          tx,
          semEstoqueLocal.pedidoId,
          "pedido_cancelado",
        );
      });
    }
    console.log(
      "[recompensa:integracao] estoque local, modalidades sem estoque, concorrência e fidelidade passaram",
    );
  } finally {
    await limpar();
    await encerrarBancoTransacionalIntegracao();
  }
}

export const execucao = executar();
