import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { eq, like } from "drizzle-orm";

import {
  categoryTable,
  checkoutClientesTable,
  checkoutEnderecosTable,
  checkoutEstoqueAlocacoesTable,
  checkoutPagamentosTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidoItensTable,
  checkoutPedidoLogisticasTable,
  checkoutPedidosTable,
  marcaTable,
  modelosRetiradaTable,
  productPricingTable,
  productTable,
  productVariantTable,
} from "@/db/schema";
import { dbTransacional, encerrarBancoTransacionalIntegracao } from "@/db/transaction";
import { calcularResumoCheckout } from "@/features/checkout/queries/resumo-checkout/calcular-resumo-checkout";

import { expirarPagamentoPendente } from "../../lib/pagamentos/expirar-pagamento-pendente";
import { comprometerAlocacoesEstoquePedido } from "../estoque/comprometer-alocacoes-estoque-pedido";
import { liberarAlocacoesEstoquePedido } from "../estoque/liberar-alocacoes-estoque-pedido";
import { confirmarPagamentoRecebido } from "../pagamentos/confirmar-pagamento-recebido";
import { criarPedidoCheckoutVisitanteInterno } from "./criar-pedido-checkout-visitante";

const sufixo = randomUUID();
const prefixo = `it-estoque-${sufixo}`;
const categoriaId = randomUUID();
const marcaId = randomUUID();
const modeloRetiradaId = randomUUID();
const produtoId = randomUUID();
const produtoBId = randomUUID();
const [varianteId, varianteBId] = [randomUUID(), randomUUID()].sort();
const precoEmCentavos = 10_000;
const cep = "30110000";

type Modalidade = "stock" | "pre_sale" | "dropshipping" | "order_basis";
type ItemTeste = ReturnType<typeof montarItem>;

function montarItem(indice: number, quantidade: number, modalidade: Modalidade = "stock", segundoProduto = false) {
  return {
    id: `${prefixo}:item:${indice}`,
    produtoId: segundoProduto ? produtoBId : produtoId,
    produtoVarianteId: segundoProduto ? varianteBId : varianteId,
    nome: segundoProduto ? "Segundo produto fixture de estoque" : "Produto fixture de estoque",
    sku: segundoProduto ? `SKU-B-${prefixo}` : `SKU-${prefixo}`,
    modalidadeTipo: modalidade,
    imagemUrl: "https://example.invalid/fixture.webp",
    precoEmCentavos,
    quantidade,
    freteEscolhido: {
      id: "retirada" as const,
      nome: "Retirada fixture de estoque",
      prazo: "Disponível imediatamente",
      valorEmCentavos: 0,
      cep,
    },
  };
}

async function prepararFixture() {
  await dbTransacional.insert(categoryTable).values({
    id: categoriaId,
    name: "Categoria fixture de estoque",
    slug: `categoria-${prefixo}`,
  });
  await dbTransacional.insert(marcaTable).values({
    id: marcaId,
    nome: "Marca fixture de estoque",
    slug: `marca-${prefixo}`,
  });
  await dbTransacional.insert(modelosRetiradaTable).values({
    id: modeloRetiradaId,
    nome: "Retirada fixture de estoque",
    prazoTexto: "Disponível imediatamente",
    ativo: true,
  });
  await dbTransacional.insert(productTable).values({
    id: produtoId,
    categoryId: categoriaId,
    marcaId,
    name: "Produto fixture de estoque",
    slug: `produto-${prefixo}`,
    description: "Fixture isolada para provar overselling do checkout.",
    sku: `SKU-${prefixo}`,
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
    id: varianteId,
    productId: produtoId,
    sku: `SKU-${prefixo}`,
    name: "Variante técnica",
    attributes: {},
    priceInCents: precoEmCentavos,
    stockQuantity: 1,
    isActive: true,
    isDefault: true,
  });
  await dbTransacional.insert(productTable).values({
    id: produtoBId,
    categoryId: categoriaId,
    marcaId,
    name: "Segundo produto fixture de estoque",
    slug: `produto-b-${prefixo}`,
    description: "Segunda variante para testar rollback transacional.",
    sku: `SKU-B-${prefixo}`,
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
    productId: produtoBId,
    type: "stock",
    price: precoEmCentavos,
    mainCardPrice: true,
    isActive: true,
  });
  await dbTransacional.insert(productVariantTable).values({
    id: varianteBId,
    productId: produtoBId,
    sku: `SKU-B-${prefixo}`,
    name: "Variante técnica B",
    attributes: {},
    priceInCents: precoEmCentavos,
    stockQuantity: 1,
    isActive: true,
    isDefault: true,
  });
}

async function limparFixture() {
  const clientes = await dbTransacional
    .select({ id: checkoutClientesTable.id })
    .from(checkoutClientesTable)
    .where(like(checkoutClientesTable.email, `${prefixo}%@example.invalid`));
  for (const cliente of clientes) {
    const pedidos = await dbTransacional
      .select({ id: checkoutPedidosTable.id })
      .from(checkoutPedidosTable)
      .where(eq(checkoutPedidosTable.clienteId, cliente.id));
    for (const pedido of pedidos) {
      await dbTransacional.delete(checkoutEstoqueAlocacoesTable).where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.id));
      // Itens, pagamento, histórico e logística são removidos pelas FKs do pedido.
      await dbTransacional.delete(checkoutPedidosTable).where(eq(checkoutPedidosTable.id, pedido.id));
    }
    await dbTransacional.delete(checkoutEnderecosTable).where(eq(checkoutEnderecosTable.clienteId, cliente.id));
    await dbTransacional.delete(checkoutClientesTable).where(eq(checkoutClientesTable.id, cliente.id));
  }
  await dbTransacional.delete(productTable).where(eq(productTable.id, produtoId));
  await dbTransacional.delete(productTable).where(eq(productTable.id, produtoBId));
  await dbTransacional.delete(modelosRetiradaTable).where(eq(modelosRetiradaTable.id, modeloRetiradaId));
  await dbTransacional.delete(marcaTable).where(eq(marcaTable.id, marcaId));
  await dbTransacional.delete(categoryTable).where(eq(categoryTable.id, categoriaId));
}

async function selecionarRetiradas(itens: ItemTeste[]) {
  const resumo = await calcularResumoCheckout({ itens, cepEntrega: cep });
  assert.ok(resumo?.cotacoesEntrega.length, "nenhuma cotação da fixture");
  return resumo.cotacoesEntrega.map((grupo) => {
    const retirada = grupo.opcoes.find((opcao) => opcao.tipo === "retirada");
    assert.ok(retirada, "retirada da fixture indisponível");
    return {
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
    cep,
    };
  });
}

async function selecionarRetirada(itens: ItemTeste[]) {
  return (await selecionarRetiradas(itens))[0]!;
}

async function criarPedido(
  etiqueta: string,
  itens: ItemTeste[],
  selecao: Awaited<ReturnType<typeof selecionarRetirada>> | Awaited<ReturnType<typeof selecionarRetiradas>>,
  aposValidarItens?: (estoques: ReadonlyArray<{ varianteId: string; quantidade: number }>) => Promise<void>,
  formaPagamento: "pix" | "cartao" = "pix",
) {
  const email = `${prefixo}-${etiqueta}@example.invalid`;
  return criarPedidoCheckoutVisitanteInterno({
    dados: {
      nome: "Cliente Fixture Estoque",
      email,
      telefone: "11999999999",
      documento: randomUUID(),
      cep,
      rua: "Rua da Integração",
      numero: "100",
      bairro: "Centro",
      cidade: "Belo Horizonte",
      estado: "MG",
      formaPagamento,
      chaveIdempotencia: `${prefixo}:${etiqueta}`,
      selecoesEntregaPorGrupo: Array.isArray(selecao) ? selecao : [selecao],
      itens,
    },
    email,
    documento: randomUUID(),
    telefone: "11999999999",
    produtosIds: [...new Set(itens.map((item) => item.produtoId))],
    usuarioId: null,
    aposValidarItens,
  });
}

async function definirEstoque(quantidade: number) {
  await dbTransacional
    .update(productVariantTable)
    .set({ stockQuantity: quantidade })
    .where(eq(productVariantTable.id, varianteId));
}

async function estoqueAtual() {
  const [variante] = await dbTransacional
    .select({ quantidade: productVariantTable.stockQuantity })
    .from(productVariantTable)
    .where(eq(productVariantTable.id, varianteId));
  return variante?.quantidade;
}

async function estoqueVarianteB() {
  const [variante] = await dbTransacional
    .select({ quantidade: productVariantTable.stockQuantity })
    .from(productVariantTable)
    .where(eq(productVariantTable.id, varianteBId));
  return variante?.quantidade;
}

async function afirmarSemPedido(etiqueta: string) {
  const [cliente] = await dbTransacional
    .select({ id: checkoutClientesTable.id })
    .from(checkoutClientesTable)
    .where(eq(checkoutClientesTable.email, `${prefixo}-${etiqueta}@example.invalid`));
  if (!cliente) return;
  const pedidos = await dbTransacional
    .select({ id: checkoutPedidosTable.id })
    .from(checkoutPedidosTable)
    .where(eq(checkoutPedidosTable.clienteId, cliente.id));
  assert.equal(pedidos.length, 0, "pedido da tentativa falha persistiu");
}

async function cancelarEDevolver(pedidoId: string) {
  return dbTransacional.transaction(async (tx) => {
    await tx.update(checkoutPedidosTable)
      .set({ status: "canceled", updatedAt: new Date() })
      .where(eq(checkoutPedidosTable.id, pedidoId));
    return liberarAlocacoesEstoquePedido(tx, pedidoId);
  });
}

async function expirarPedido(pedido: { pedidoId: string; pagamentoId: string }) {
  return dbTransacional.transaction((tx) => expirarPagamentoPendente({
    tx,
    pedidoId: pedido.pedidoId,
    pagamentoId: pedido.pagamentoId,
    gateway: "efibank",
    referencia: `${prefixo}:expiracao:${pedido.pedidoId}`,
  }));
}

async function expirarPedidoStripe(pedido: { pedidoId: string; pagamentoId: string }) {
  return dbTransacional.transaction((tx) => expirarPagamentoPendente({
    tx,
    pedidoId: pedido.pedidoId,
    pagamentoId: pedido.pagamentoId,
    gateway: "stripe",
    referencia: `${prefixo}:expiracao-stripe:${pedido.pedidoId}`,
  }));
}

async function confirmarPagamentoDeTeste(pedido: { pedidoId: string; pagamentoId: string }) {
  return dbTransacional.transaction(async (tx) => {
    await tx.update(checkoutPagamentosTable)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(checkoutPagamentosTable.id, pedido.pagamentoId));
    return confirmarPagamentoRecebido(tx, pedido.pedidoId);
  });
}

// As duas chamadas só avançam quando ambas terminaram a validação de estoque.
function criarBarreiraDupla() {
  const observacoes: number[] = [];
  let liberar!: () => void;
  const liberada = new Promise<void>((resolve) => { liberar = resolve; });
  return {
    observacoes,
    async aguardar(estoques: ReadonlyArray<{ varianteId: string; quantidade: number }>) {
      const observado = estoques.find((linha) => linha.varianteId === varianteId);
      assert.ok(observado, "a variante fixture não foi lida");
      observacoes.push(observado.quantidade);
      if (observacoes.length === 2) liberar();
      await liberada;
    },
  };
}

async function executar() {
  try {
    await prepararFixture();

    await test("stock: duas compras da última unidade não podem criar dois pedidos", async () => {
      await definirEstoque(1);
      const item = montarItem(1, 1);
      const selecao = await selecionarRetirada([item]);
      const barreira = criarBarreiraDupla();
      const resultados = await Promise.allSettled([
        criarPedido("concorrencia-a", [item], selecao, barreira.aguardar),
        criarPedido("concorrencia-b", [item], selecao, barreira.aguardar),
      ]);
      const pedidosCriados = resultados.filter((resultado) => resultado.status === "fulfilled");
      const estoqueFinal = await estoqueAtual();
      const alocacoes = await dbTransacional
        .select()
        .from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.varianteId, varianteId));
      console.log("[estoque:concorrencia]", {
        estoqueInicial: 1,
        observacoes: barreira.observacoes,
        resultados: resultados.map((resultado) => resultado.status),
        pedidosCriados: pedidosCriados.length,
        alocacoes: alocacoes.length,
        estoqueFinal,
      });
      assert.deepEqual(barreira.observacoes, [1, 1]);
      assert.equal(pedidosCriados.length, 1, "overselling: duas compras da última unidade foram aceitas");
      assert.equal(alocacoes.length, 1);
      assert.equal(estoqueFinal, 0);
    });

    await test("stock: itens repetidos devem somar quantidade por variante", async () => {
      await definirEstoque(3);
      const itens = [montarItem(2, 2), montarItem(3, 2)];
      const selecao = await selecionarRetirada(itens);
      const resultado = await Promise.allSettled([criarPedido("duplicidade", itens, selecao)]);
      const pedidoCriado = resultado[0]?.status === "fulfilled" ? resultado[0].value : null;
      const itensPersistidos = pedidoCriado
        ? await dbTransacional
            .select({ quantidade: checkoutPedidoItensTable.quantidade })
            .from(checkoutPedidoItensTable)
            .where(eq(checkoutPedidoItensTable.pedidoId, pedidoCriado.pedidoId))
        : [];
      console.log("[estoque:mesma-variante]", {
        estoqueInicial: 3,
        quantidades: [2, 2],
        totalSolicitado: 4,
        resultado: resultado[0]?.status,
        itensPersistidos: itensPersistidos.map((item) => item.quantidade),
        estoqueFinal: await estoqueAtual(),
      });
      assert.equal(resultado[0]?.status, "rejected", "dois itens da mesma variante excederam o estoque e foram aceitos");
      assert.equal(itensPersistidos.length, 0);
      await afirmarSemPedido("duplicidade");
      const alocacoes = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable).where(eq(checkoutEstoqueAlocacoesTable.varianteId, varianteId));
      assert.equal(alocacoes.length, 1, "tentativa duplicada gravou alocação adicional");
      assert.equal(await estoqueAtual(), 3);
    });

    await test("stock: rollback restaura primeira variante quando segunda falha", async () => {
      await definirEstoque(2);
      const itens = [
        montarItem(4, 1),
        montarItem(5, 1, "stock", true),
        montarItem(6, 1, "stock", true),
      ];
      const selecoes = await selecionarRetiradas(itens);
      const resultado = await Promise.allSettled([criarPedido("rollback", itens, selecoes)]);
      assert.equal(resultado[0]?.status, "rejected");
      assert.equal(await estoqueAtual(), 2, "a primeira variante não voltou após rollback");
      assert.equal(await estoqueVarianteB(), 1);
      await afirmarSemPedido("rollback");
      const alocacoesB = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable).where(eq(checkoutEstoqueAlocacoesTable.varianteId, varianteBId));
      assert.equal(alocacoesB.length, 0);
      const alocacoesA = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable).where(eq(checkoutEstoqueAlocacoesTable.varianteId, varianteId));
      assert.equal(alocacoesA.length, 1, "rollback deixou alocação da primeira variante");
    });

    await test("stock: retry da mesma chave não debita nem aloca novamente", async () => {
      await definirEstoque(2);
      const item = montarItem(10, 1);
      const selecao = await selecionarRetirada([item]);
      const primeiro = await criarPedido("retry", [item], selecao);
      const estoqueDepoisDoPrimeiro = await estoqueAtual();
      const segundo = await criarPedido("retry", [item], selecao);
      const alocacoes = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, primeiro.pedidoId));
      assert.equal(segundo.pedidoId, primeiro.pedidoId);
      assert.equal(segundo.jaExistia, true);
      assert.equal(estoqueDepoisDoPrimeiro, 1);
      assert.equal(await estoqueAtual(), 1);
      assert.equal(alocacoes.length, 1);
      assert.equal(alocacoes[0]?.quantidade, 1);
    });

    await test("expiração PIX pré-expedição libera uma vez", async () => {
      await definirEstoque(10);
      const item = montarItem(18, 2);
      const pedido = await criarPedido("expiracao", [item], await selecionarRetirada([item]));
      assert.equal(await estoqueAtual(), 8);
      const primeira = await expirarPedido(pedido);
      const segunda = await expirarPedido(pedido);
      const [alocacao] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      assert.equal(primeira.expiradoAgora, true);
      assert.equal(segunda.expiradoAgora, false);
      assert.equal(await estoqueAtual(), 10);
      assert.equal(alocacao?.status, "liberada");
    });

    await test("expiração Stripe pré-expedição usa o mesmo núcleo e libera uma vez", async () => {
      await definirEstoque(6);
      const item = montarItem(29, 1);
      const pedido = await criarPedido("expiracao-stripe", [item], await selecionarRetirada([item]), undefined, "cartao");
      const [pagamento] = await dbTransacional.select({ gateway: checkoutPagamentosTable.gateway })
        .from(checkoutPagamentosTable).where(eq(checkoutPagamentosTable.id, pedido.pagamentoId));
      assert.equal(pagamento?.gateway, "stripe");
      assert.equal(await estoqueAtual(), 5);
      const primeira = await expirarPedidoStripe(pedido);
      const segunda = await expirarPedidoStripe(pedido);
      const [alocacao] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      assert.equal(primeira.expiradoAgora, true);
      assert.equal(segunda.expiradoAgora, false);
      assert.equal(alocacao?.status, "liberada");
      assert.equal(await estoqueAtual(), 6);
    });

    await test("pagamento tardio com estoque livre reobtém sem novo débito em retry", async () => {
      await definirEstoque(1);
      const item = montarItem(19, 1);
      const pedido = await criarPedido("tardio-disponivel", [item], await selecionarRetirada([item]));
      await expirarPedido(pedido);
      assert.equal(await estoqueAtual(), 1);
      const primeiro = await confirmarPagamentoDeTeste(pedido);
      const segundo = await dbTransacional.transaction((tx) => confirmarPagamentoRecebido(tx, pedido.pedidoId));
      const [pedidoPago] = await dbTransacional.select().from(checkoutPedidosTable)
        .where(eq(checkoutPedidosTable.id, pedido.pedidoId));
      const [alocacao] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      assert.equal(primeiro.recursos, "prontos");
      assert.equal(segundo.recursos, "prontos");
      assert.equal(pedidoPago?.pagamentoStatus, "paid");
      assert.equal(pedidoPago?.status, "processing");
      assert.equal(alocacao?.status, "alocada");
      assert.equal(await estoqueAtual(), 0);
    });

    await test("pagamento após cancelamento reconhece dinheiro sem reter estoque novamente", async () => {
      await definirEstoque(3);
      const item = montarItem(30, 1);
      const pedido = await criarPedido("pago-apos-cancelamento", [item], await selecionarRetirada([item]));
      await cancelarEDevolver(pedido.pedidoId);
      assert.equal(await estoqueAtual(), 3);
      const resultado = await confirmarPagamentoDeTeste(pedido);
      const [pedidoAtual] = await dbTransacional.select({
        status: checkoutPedidosTable.status,
        pagamentoStatus: checkoutPedidosTable.pagamentoStatus,
      }).from(checkoutPedidosTable).where(eq(checkoutPedidosTable.id, pedido.pedidoId));
      const [alocacao] = await dbTransacional.select({ status: checkoutEstoqueAlocacoesTable.status })
        .from(checkoutEstoqueAlocacoesTable).where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      assert.equal(resultado.recursos, "indisponiveis");
      assert.equal(pedidoAtual?.status, "canceled");
      assert.equal(pedidoAtual?.pagamentoStatus, "paid");
      assert.equal(alocacao?.status, "liberada");
      assert.equal(await estoqueAtual(), 3);
    });

    await test("pagamento tardio sem última unidade reconhece dinheiro e bloqueia atendimento", async () => {
      await definirEstoque(1);
      const itemA = montarItem(20, 1);
      const pedidoA = await criarPedido("tardio-sem-estoque-a", [itemA], await selecionarRetirada([itemA]));
      await expirarPedido(pedidoA);
      const itemB = montarItem(21, 1);
      const pedidoB = await criarPedido("tardio-sem-estoque-b", [itemB], await selecionarRetirada([itemB]));
      const tardio = await confirmarPagamentoDeTeste(pedidoA);
      const [a] = await dbTransacional.select().from(checkoutPedidosTable).where(eq(checkoutPedidosTable.id, pedidoA.pedidoId));
      const [b] = await dbTransacional.select().from(checkoutPedidosTable).where(eq(checkoutPedidosTable.id, pedidoB.pedidoId));
      const [alocacaoA] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoA.pedidoId));
      const [alocacaoB] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoB.pedidoId));
      assert.equal(tardio.recursos, "indisponiveis");
      assert.equal(a?.pagamentoStatus, "paid");
      assert.equal(a?.status, "pagamento_recebido_sem_recursos");
      assert.equal(b?.status, "pending");
      assert.equal(alocacaoA?.status, "liberada");
      assert.equal(alocacaoB?.status, "alocada");
      assert.equal(await estoqueAtual(), 0);
      const expedicao = await dbTransacional.transaction((tx) => comprometerAlocacoesEstoquePedido(tx, pedidoA.pedidoId, "entrega_em_maos"));
      assert.equal(expedicao.permitido, false);
    });

    await test("pagamento tardio concorre com nova compra pela mesma unidade", async () => {
      await definirEstoque(1);
      const itemA = montarItem(22, 1);
      const pedidoA = await criarPedido("disputa-a", [itemA], await selecionarRetirada([itemA]));
      await expirarPedido(pedidoA);
      const itemB = montarItem(23, 1);
      const selecaoB = await selecionarRetirada([itemB]);
      const resultados = await Promise.allSettled([
        confirmarPagamentoDeTeste(pedidoA),
        criarPedido("disputa-b", [itemB], selecaoB),
      ]);
      const tarde = resultados[0]?.status === "fulfilled" ? resultados[0].value : null;
      assert.ok(tarde, "pagamento recebido não foi reconhecido");
      const compraB = resultados[1]?.status === "fulfilled";
      assert.equal(tarde.recursos === "prontos" ? 1 : 0, compraB ? 0 : 1);
      assert.equal(await estoqueAtual(), 0);
      const alocacoesValidas = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.varianteId, varianteId));
      const destaDisputa = alocacoesValidas.filter((alocacao) =>
        alocacao.pedidoId === pedidoA.pedidoId ||
        (resultados[1]?.status === "fulfilled" && alocacao.pedidoId === resultados[1].value.pedidoId));
      assert.equal(destaDisputa.filter((alocacao) => alocacao.status === "alocada").length, 1);
    });

    await test("pagamento tardio multivariante falha sem realocação parcial", async () => {
      await definirEstoque(2);
      await dbTransacional.update(productVariantTable).set({ stockQuantity: 1 })
        .where(eq(productVariantTable.id, varianteBId));
      const itensA = [montarItem(24, 1), montarItem(25, 1, "stock", true)];
      const pedidoA = await criarPedido("tardio-multivar-a", itensA, await selecionarRetiradas(itensA));
      await expirarPedido(pedidoA);
      const itemB = montarItem(26, 1, "stock", true);
      await criarPedido("tardio-multivar-b", [itemB], await selecionarRetirada([itemB]));
      const tardio = await confirmarPagamentoDeTeste(pedidoA);
      const alocacoesA = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedidoA.pedidoId));
      assert.equal(tardio.recursos, "indisponiveis");
      assert.equal(tardio.statusOperacional, "pagamento_recebido_sem_recursos");
      assert.equal(await estoqueAtual(), 2, "savepoint não reverteu a primeira variante");
      assert.equal(await estoqueVarianteB(), 0);
      assert.deepEqual(alocacoesA.map((alocacao) => alocacao.status).sort(), ["liberada", "liberada"]);
    });

    await test("retirada só compromete na entrega em mãos, sem novo débito", async () => {
      await definirEstoque(4);
      const item = montarItem(27, 1);
      const pedido = await criarPedido("retirada-fisica", [item], await selecionarRetirada([item]));
      await confirmarPagamentoDeTeste(pedido);
      const envio = await dbTransacional.transaction((tx) => comprometerAlocacoesEstoquePedido(tx, pedido.pedidoId, "envio"));
      assert.equal(envio.permitido, false);
      const primeira = await dbTransacional.transaction((tx) => comprometerAlocacoesEstoquePedido(tx, pedido.pedidoId, "entrega_em_maos"));
      const segunda = await dbTransacional.transaction((tx) => comprometerAlocacoesEstoquePedido(tx, pedido.pedidoId, "entrega_em_maos"));
      const [alocacao] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      assert.equal(primeira.permitido, true);
      assert.equal(primeira.transicoes, 1);
      assert.equal(segunda.transicoes, 0);
      assert.equal(alocacao?.status, "comprometida");
      assert.equal(await estoqueAtual(), 3);
      const cancelamento = await cancelarEDevolver(pedido.pedidoId);
      assert.equal(cancelamento.unidadesDevolvidas, 0);
      assert.equal(await estoqueAtual(), 3);
    });

    await test("entrega compromete no envio e não debita outra vez", async () => {
      await definirEstoque(4);
      const item = montarItem(31, 1);
      const pedido = await criarPedido("entrega-fisica", [item], await selecionarRetirada([item]));
      await confirmarPagamentoDeTeste(pedido);
      // A fixture real só oferece retirada. Troca-se apenas o tipo do snapshot
      // para exercitar o núcleo físico de entrega sem cotar um frete externo.
      const [logistica] = await dbTransacional.select({ snapshot: checkoutPedidoLogisticasTable.snapshotFrete })
        .from(checkoutPedidoLogisticasTable).where(eq(checkoutPedidoLogisticasTable.pedidoId, pedido.pedidoId));
      assert.equal(logistica?.snapshot?.versao, "2");
      if (logistica?.snapshot?.versao !== "2") throw new Error("Snapshot v2 esperado");
      await dbTransacional.update(checkoutPedidoLogisticasTable).set({
        snapshotFrete: {
          ...logistica.snapshot,
          grupos: logistica.snapshot.grupos.map((grupo) => ({
            ...grupo,
            entrega: { ...grupo.entrega, tipo: "entrega" as const, provedor: "entrega-propria" },
          })),
        },
      }).where(eq(checkoutPedidoLogisticasTable.pedidoId, pedido.pedidoId));
      const antesDoEnvio = await dbTransacional.transaction((tx) =>
        comprometerAlocacoesEstoquePedido(tx, pedido.pedidoId, "entrega_em_maos"));
      assert.equal(antesDoEnvio.permitido, false);
      const envio = await dbTransacional.transaction((tx) =>
        comprometerAlocacoesEstoquePedido(tx, pedido.pedidoId, "envio"));
      const retry = await dbTransacional.transaction((tx) =>
        comprometerAlocacoesEstoquePedido(tx, pedido.pedidoId, "envio"));
      assert.equal(envio.permitido, true);
      assert.equal(envio.transicoes, 1);
      assert.equal(retry.transicoes, 0);
      assert.equal(await estoqueAtual(), 3);
      const [alocacao] = await dbTransacional.select({ status: checkoutEstoqueAlocacoesTable.status })
        .from(checkoutEstoqueAlocacoesTable).where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      assert.equal(alocacao?.status, "comprometida");
      assert.equal((await cancelarEDevolver(pedido.pedidoId)).unidadesDevolvidas, 0);
      assert.equal(await estoqueAtual(), 3);
    });

    await test("pedido stock sem alocação válida não pode chegar à entrega em mãos", async () => {
      await definirEstoque(4);
      const item = montarItem(28, 1);
      const pedido = await criarPedido("alocacao-ausente", [item], await selecionarRetirada([item]));
      await confirmarPagamentoDeTeste(pedido);
      await dbTransacional.delete(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      const marco = await dbTransacional.transaction((tx) =>
        comprometerAlocacoesEstoquePedido(tx, pedido.pedidoId, "entrega_em_maos"));
      assert.equal(marco.permitido, false);
      assert.match(marco.mensagem, /sem alocação válida/);
      assert.equal(await estoqueAtual(), 3, "bloqueio não deve inventar retorno de estoque");
    });

    await test("cancelamento pré-expedição devolve uma vez, inclusive no retry", async () => {
      await definirEstoque(10);
      const item = montarItem(11, 2);
      const pedido = await criarPedido("cancelamento", [item], await selecionarRetirada([item]));
      assert.equal(await estoqueAtual(), 8);
      const primeira = await cancelarEDevolver(pedido.pedidoId);
      const segunda = await cancelarEDevolver(pedido.pedidoId);
      const [alocacao] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      assert.deepEqual(primeira, { alocacoesLiberadas: 1, unidadesDevolvidas: 2 });
      assert.deepEqual(segunda, { alocacoesLiberadas: 0, unidadesDevolvidas: 0 });
      assert.equal(alocacao?.status, "liberada");
      assert.equal(await estoqueAtual(), 10);
    });

    await test("duas liberações concorrentes do mesmo pedido não duplicam estoque", async () => {
      await definirEstoque(10);
      const item = montarItem(12, 2);
      const pedido = await criarPedido("liberacao-concorrente", [item], await selecionarRetirada([item]));
      assert.equal(await estoqueAtual(), 8);
      await dbTransacional.update(checkoutPedidosTable)
        .set({ status: "canceled" })
        .where(eq(checkoutPedidosTable.id, pedido.pedidoId));
      const resultados = await Promise.all([
        dbTransacional.transaction((tx) => liberarAlocacoesEstoquePedido(tx, pedido.pedidoId)),
        dbTransacional.transaction((tx) => liberarAlocacoesEstoquePedido(tx, pedido.pedidoId)),
      ]);
      const [alocacao] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      assert.deepEqual(resultados.map((resultado) => resultado.unidadesDevolvidas).sort(), [0, 2]);
      assert.equal(await estoqueAtual(), 10);
      assert.equal(alocacao?.status, "liberada");
    });

    await test("cancelamento devolve cada variante agregada, sem repetir", async () => {
      await definirEstoque(5);
      await dbTransacional.update(productVariantTable).set({ stockQuantity: 6 })
        .where(eq(productVariantTable.id, varianteBId));
      const itens = [montarItem(13, 2), montarItem(14, 3, "stock", true)];
      const pedido = await criarPedido("multiplas", itens, await selecionarRetiradas(itens));
      assert.equal(await estoqueAtual(), 3);
      assert.equal(await estoqueVarianteB(), 3);
      const primeira = await cancelarEDevolver(pedido.pedidoId);
      const segunda = await cancelarEDevolver(pedido.pedidoId);
      const alocacoes = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      assert.deepEqual(primeira, { alocacoesLiberadas: 2, unidadesDevolvidas: 5 });
      assert.equal(segunda.unidadesDevolvidas, 0);
      assert.equal(await estoqueAtual(), 5);
      assert.equal(await estoqueVarianteB(), 6);
      assert.deepEqual(alocacoes.map((alocacao) => alocacao.status), ["liberada", "liberada"]);
    });

    await test("alocação comprometida não é liberada por cancelamento financeiro", async () => {
      await definirEstoque(4);
      const item = montarItem(15, 1);
      const pedido = await criarPedido("comprometida", [item], await selecionarRetirada([item]));
      await dbTransacional.update(checkoutEstoqueAlocacoesTable)
        .set({ status: "comprometida" })
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      const resultado = await cancelarEDevolver(pedido.pedidoId);
      assert.equal(resultado.unidadesDevolvidas, 0);
      assert.equal(await estoqueAtual(), 3);
    });

    await test("falha no incremento reverte a transição da alocação", async () => {
      await definirEstoque(4);
      const item = montarItem(17, 2);
      const pedido = await criarPedido("rollback-liberacao", [item], await selecionarRetirada([item]));
      // Provoca overflow do integer somente nesta fixture: o PostgreSQL deve
      // desfazer a mudança de estado da alocação na mesma transação.
      await definirEstoque(2_147_483_647);
      await assert.rejects(() => cancelarEDevolver(pedido.pedidoId));
      const [alocacao] = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable)
        .where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
      const [pedidoPersistido] = await dbTransacional.select({ status: checkoutPedidosTable.status })
        .from(checkoutPedidosTable).where(eq(checkoutPedidosTable.id, pedido.pedidoId));
      assert.equal(alocacao?.status, "alocada");
      assert.equal(pedidoPersistido?.status, "pending");
      assert.equal(await estoqueAtual(), 2_147_483_647);
    });

    for (const statusFisico of ["shipped", "delivered"] as const) {
      await test(`${statusFisico}: cancelamento/reembolso financeiro não devolve estoque`, async () => {
        await definirEstoque(4);
        const item = montarItem(16, 1);
        const pedido = await criarPedido(`fisico-${statusFisico}`, [item], await selecionarRetirada([item]));
        if (statusFisico === "shipped") {
          // Uma alteração manual pode registrar apenas o histórico de envio.
          await dbTransacional.insert(checkoutPedidoHistoricosTable).values({
            pedidoId: pedido.pedidoId,
            tipo: "status_alterado_manual",
            descricao: "Marco físico fixture",
            origem: "admin",
            statusNovo: statusFisico,
          });
        } else {
          // O marco físico na logística também é suficiente, isoladamente.
          await dbTransacional.update(checkoutPedidoLogisticasTable)
            .set({ dataEnvio: new Date(), dataEntrega: new Date() })
            .where(eq(checkoutPedidoLogisticasTable.pedidoId, pedido.pedidoId));
        }
        const resultado = await cancelarEDevolver(pedido.pedidoId);
        assert.equal(resultado.unidadesDevolvidas, 0);
        assert.equal(await estoqueAtual(), 3);
      });
    }

    await test("stock: quantidade maior que estoque é rejeitada", async () => {
      await definirEstoque(2);
      const item = montarItem(7, 3);
      const selecao = await selecionarRetirada([montarItem(8, 1)]);
      const resultado = await Promise.allSettled([criarPedido("limite", [item], selecao)]);
      assert.equal(resultado[0]?.status, "rejected");
      assert.equal(await estoqueAtual(), 2);
      await afirmarSemPedido("limite");
    });

    for (const modalidade of ["pre_sale", "dropshipping", "order_basis"] as const) {
      await test(`${modalidade}: não debita estoque local nem cria alocação`, async () => {
        await definirEstoque(0);
        await dbTransacional.update(productPricingTable).set({ type: modalidade }).where(eq(productPricingTable.productId, produtoId));
        const item = montarItem(9, 1, modalidade);
        const selecao = await selecionarRetirada([item]);
        const pedido = await criarPedido(`modalidade-${modalidade}`, [item], selecao);
        const alocacoes = await dbTransacional.select().from(checkoutEstoqueAlocacoesTable).where(eq(checkoutEstoqueAlocacoesTable.pedidoId, pedido.pedidoId));
        assert.equal(alocacoes.length, 0);
        assert.equal(await estoqueAtual(), 0);
        await confirmarPagamentoDeTeste(pedido);
        const marco = await dbTransacional.transaction((tx) =>
          comprometerAlocacoesEstoquePedido(tx, pedido.pedidoId, "entrega_em_maos"));
        assert.equal(marco.permitido, true, "modalidade sem estoque local não exige alocação local");
        assert.equal(marco.transicoes, 0);
        const cancelamento = await cancelarEDevolver(pedido.pedidoId);
        assert.deepEqual(cancelamento, { alocacoesLiberadas: 0, unidadesDevolvidas: 0 });
      });
    }
  } finally {
    await limparFixture();
    await encerrarBancoTransacionalIntegracao();
  }
}

export const execucao = executar();
