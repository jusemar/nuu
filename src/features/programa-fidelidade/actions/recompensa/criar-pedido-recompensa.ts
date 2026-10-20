import "server-only";

import { eq, sql } from "drizzle-orm";

import {
  checkoutClientesTable,
  checkoutEnderecosTable,
  checkoutPagamentosTable,
  checkoutPedidoItensTable,
  checkoutPedidoLogisticasTable,
  checkoutPedidosTable,
  productTable,
  reservasFidelidadeTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { alocarEstoqueLocalPedido } from "@/features/checkout/actions/estoque/alocar-estoque-local-pedido";
import { confirmarPagamentoRecebido } from "@/features/checkout/actions/pagamentos/confirmar-pagamento-recebido";
import { montarRegistroSnapshotFretePedido } from "@/features/checkout/lib/frete/montar-registro-snapshot-frete-pedido";
import type { CheckoutVisitanteSchema } from "@/features/checkout/schemas/checkout.schema";
import { calcularFreteRecompensa } from "@/features/programa-fidelidade/lib/calcular-frete-recompensa";
import { processarEventoPedidoFidelidade } from "@/features/programa-fidelidade/lib/processar-evento-pedido-fidelidade";
import { reservarPontosRecompensaPedido } from "@/features/programa-fidelidade/lib/processar-resgate-fidelidade";

type TransacaoBanco = Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0];

/** Confirma apenas recompensa válida sem cobrança; pedidos normais jamais entram aqui. */
export async function confirmarRecompensaSemCobrancaInterno(tx: TransacaoBanco, pedidoId: string) {
  await tx.execute(sql`select id from checkout_pedidos where id = ${pedidoId} for update`);
  const pedido = await tx.query.checkoutPedidosTable.findFirst({
    where: eq(checkoutPedidosTable.id, pedidoId),
  });
  if (
    !pedido || pedido.modalidadePedido !== "recompensa" ||
    !pedido.recompensaCustoPontosSnapshot || pedido.totalEmCentavos !== 0 ||
    pedido.gatewayPagamento !== "interno" || !pedido.reservaFidelidadeId
  ) throw new Error("CONFIRMACAO_INTERNA_RECOMPENSA_INVALIDA");
  const [itens, reserva, pagamento] = await Promise.all([
    tx.select().from(checkoutPedidoItensTable).where(eq(checkoutPedidoItensTable.pedidoId, pedidoId)),
    tx.query.reservasFidelidadeTable.findFirst({
      where: eq(reservasFidelidadeTable.id, pedido.reservaFidelidadeId!),
    }),
    tx.query.checkoutPagamentosTable.findFirst({
      where: eq(checkoutPagamentosTable.pedidoId, pedidoId),
    }),
  ]);
  if (
    itens.length !== 1 || itens[0]?.quantidade !== 1 ||
    reserva?.modalidade !== "recompensa" ||
    Number(reserva.pontos) !== pedido.recompensaCustoPontosSnapshot ||
    pagamento?.gateway !== "interno" || pagamento.metodo !== "pontos" ||
    pagamento.valorEmCentavos !== 0
  ) throw new Error("CONFIRMACAO_INTERNA_RECOMPENSA_INCONSISTENTE");
  if (pagamento.status === "paid") return { confirmadoAgora: false };
  if (pedido.status !== "pending" || reserva.status !== "reservada" || pagamento.status !== "pending") {
    throw new Error("CONFIRMACAO_INTERNA_RECOMPENSA_ESTADO_INVALIDO");
  }
  await tx.update(checkoutPagamentosTable).set({ status: "paid", paidAt: new Date() })
    .where(eq(checkoutPagamentosTable.id, pagamento.id));
  const confirmado = await confirmarPagamentoRecebido(tx, pedidoId);
  if (confirmado.recursos !== "prontos") throw new Error("RECURSOS_RECOMPENSA_INDISPONIVEIS");
  await processarEventoPedidoFidelidade(tx, pedidoId, "pagamento_confirmado");
  return { confirmadoAgora: true };
}

/** Núcleo transacional usado pelo backend e por testes fora da requisição Next. */
export async function criarPedidoRecompensaInterno({
  dados,
  usuarioId,
}: {
  dados: CheckoutVisitanteSchema;
  usuarioId: string;
}) {
  if (dados.itens.length !== 1) throw new Error("RECOMPENSA_EXIGE_PRODUTO_UNICO");
  if (dados.itens[0]?.quantidade !== 1) throw new Error("RECOMPENSA_EXIGE_QUANTIDADE_UM");
  if (dados.cupom || (dados.pontosResgate && Number(dados.pontosResgate) > 0)) {
    throw new Error("RECOMPENSA_NAO_COMBINA_COM_DESCONTOS");
  }
  if (dados.formaPagamento !== "pix") throw new Error("RECOMPENSA_FRETE_PAGAMENTO_PIX_V1");
  if (!dados.chaveIdempotencia) throw new Error("CHAVE_IDEMPOTENCIA_NECESSARIA");

  return dbTransacional.transaction(async (tx) => {
    const pedidoAnterior = await tx.query.checkoutPedidosTable.findFirst({
      where: eq(checkoutPedidosTable.chaveIdempotencia, dados.chaveIdempotencia!),
    });
    if (pedidoAnterior) {
      if (pedidoAnterior.modalidadePedido !== "recompensa") throw new Error("CHAVE_IDEMPOTENCIA_INCOMPATIVEL");
      const clienteAnterior = await tx.query.checkoutClientesTable.findFirst({
        where: eq(checkoutClientesTable.id, pedidoAnterior.clienteId),
      });
      if (clienteAnterior?.userId !== usuarioId) throw new Error("PEDIDO_RECOMPENSA_DE_OUTRO_CLIENTE");
      return {
        pedidoId: pedidoAnterior.id,
        totalEmCentavos: pedidoAnterior.totalEmCentavos,
        jaExistia: true,
      };
    }
    const cliente = await tx.query.checkoutClientesTable.findFirst({
      where: eq(checkoutClientesTable.userId, usuarioId),
    });
    if (!cliente) throw new Error("CLIENTE_AUTENTICADO_NECESSARIO");
    const item = dados.itens[0]!;
    const produto = await tx.query.productTable.findFirst({
      where: eq(productTable.id, item.produtoId),
      with: { pricing: true, galleryImages: true, variants: true },
    });
    if (!produto?.recompensaPontosAtiva || !produto.recompensaCustoPontos ||
      !Number.isSafeInteger(produto.recompensaCustoPontos) || produto.recompensaCustoPontos <= 0
    ) throw new Error("PRODUTO_NAO_ELEGIVEL_RECOMPENSA");
    const { itemNormal, varianteEstoqueLocalId, freteValidado, freteFinal } =
      await calcularFreteRecompensa({ item, produto, entrega: dados });

    const [endereco] = await tx.insert(checkoutEnderecosTable).values({
      clienteId: cliente.id,
      cep: dados.cep.replace(/\D/g, ""),
      rua: dados.rua.trim(),
      numero: dados.numero.trim(),
      complemento: dados.complemento?.trim() || null,
      bairro: dados.bairro.trim(),
      cidade: dados.cidade.trim(),
      estado: dados.estado.trim().toUpperCase(),
    }).returning();
    if (!endereco) throw new Error("ENDERECO_RECOMPENSA_NAO_CRIADO");
    const numero = await tx.execute<{ numeroPedido: string }>(sql`
      select '#' || nextval('checkout_pedidos_numero_pedido_seq')::text as "numeroPedido"
    `);
    const numeroPedido = numero.rows[0]?.numeroPedido;
    if (!numeroPedido) throw new Error("NUMERO_PEDIDO_RECOMPENSA_INDISPONIVEL");
    const [pedido] = await tx.insert(checkoutPedidosTable).values({
      numeroPedido,
      chaveIdempotencia: dados.chaveIdempotencia,
      clienteId: cliente.id,
      enderecoId: endereco.id,
      modalidadePedido: "recompensa",
      recompensaCustoPontosSnapshot: produto.recompensaCustoPontos,
      subtotalEmCentavos: 0,
      freteEmCentavos: freteFinal,
      totalEmCentavos: freteFinal,
      gatewayPagamento: freteFinal === 0 ? "interno" : "efibank",
      pagamentoStatus: "pending",
    }).returning();
    if (!pedido) throw new Error("PEDIDO_RECOMPENSA_NAO_CRIADO");
    await tx.insert(checkoutPedidoItensTable).values({
      ...itemNormal,
      pedidoId: pedido.id,
      quantidade: 1,
      precoUnitarioEmCentavos: 0,
      totalEmCentavos: 0,
    });
    await alocarEstoqueLocalPedido(
      tx,
      pedido.id,
      varianteEstoqueLocalId ? new Map([[varianteEstoqueLocalId, 1]]) : new Map(),
    );
    const reserva = await reservarPontosRecompensaPedido({
      tx,
      pedidoId: pedido.id,
      checkoutClienteId: cliente.id,
      custoPontos: produto.recompensaCustoPontos,
    });
    await tx.update(checkoutPedidosTable).set({ reservaFidelidadeId: reserva.id })
      .where(eq(checkoutPedidosTable.id, pedido.id));
    await tx.insert(checkoutPedidoLogisticasTable).values(
      montarRegistroSnapshotFretePedido({
        pedidoId: pedido.id,
        snapshot: freteValidado.snapshot,
      }),
    );
    const [pagamento] = await tx.insert(checkoutPagamentosTable).values({
      pedidoId: pedido.id,
      gateway: freteFinal === 0 ? "interno" : "efibank",
      metodo: freteFinal === 0 ? "pontos" : "pix",
      valorEmCentavos: freteFinal,
      status: "pending",
    }).returning();
    if (!pagamento) throw new Error("PAGAMENTO_RECOMPENSA_NAO_CRIADO");
    if (freteFinal === 0) await confirmarRecompensaSemCobrancaInterno(tx, pedido.id);
    return {
      pedidoId: pedido.id,
      pagamentoId: pagamento.id,
      numeroPedido,
      nomeCliente: cliente.nome,
      documentoCliente: cliente.documento,
      totalEmCentavos: freteFinal,
      jaExistia: false,
    };
  });
}
