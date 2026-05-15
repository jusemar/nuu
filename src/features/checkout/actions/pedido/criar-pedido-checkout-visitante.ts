"use server";

import { eq, inArray, or, sql } from "drizzle-orm";

import { dbTransacional } from "@/db/transaction";
import {
  checkoutClientesTable,
  checkoutEnderecosTable,
  checkoutPagamentosTable,
  checkoutPedidoItensTable,
  checkoutPedidosTable,
  productTable,
} from "@/db/schema";

import { calcularFreteCheckout } from "../../lib/calcular-frete-checkout";
import { calcularTotalCheckout } from "../../lib/calcular-total-checkout";
import { criarCobrancaPixEfi } from "../../lib/gateways/efi/pix-efi";
import { criarCheckoutCartaoStripe } from "../../lib/gateways/stripe/checkout-stripe";
import {
  montarSnapshotItemPedidoCheckout,
  normalizarDocumentoCheckout,
  normalizarEmailCheckout,
  normalizarTelefoneCheckout,
  normalizarTextoOpcionalCheckout,
} from "../../lib/pedidos/normalizar-checkout-visitante";
import {
  isValidCPFOrCNPJ,
  isValidNome,
  isValidTelefone,
} from "../../lib/validators";
import {
  checkoutVisitanteSchema,
  type CheckoutVisitanteSchema,
} from "../../schemas/checkout.schema";

type LinhaNumeroPedido = {
  numeroPedido: string;
};

function resolverGatewayPagamento(formaPagamento: "pix" | "cartao") {
  return formaPagamento === "pix" ? "efibank" : "stripe";
}

function montarRetornoPedidoCheckout(
  pedido: Awaited<ReturnType<typeof criarPedidoCheckoutVisitanteInterno>>,
) {
  return {
    clienteId: pedido.clienteId,
    enderecoId: pedido.enderecoId,
    pedidoId: pedido.pedidoId,
    pagamentoId: pedido.pagamentoId,
    numeroPedido: pedido.numeroPedido,
    status: pedido.status,
    pagamentoStatus: pedido.pagamentoStatus,
    totalEmCentavos: pedido.totalEmCentavos,
  };
}

export async function criarPedidoCheckoutVisitante(data: unknown) {
  const dados = checkoutVisitanteSchema.parse(data);

  if (!isValidNome(dados.nome)) {
    throw new Error("Nome inválido");
  }

  if (!isValidTelefone(dados.telefone)) {
    throw new Error("Telefone inválido");
  }

  if (!isValidCPFOrCNPJ(dados.documento)) {
    throw new Error("Documento CPF ou CNPJ inválido");
  }

  const email = normalizarEmailCheckout(dados.email);
  const documento = normalizarDocumentoCheckout(dados.documento);
  const telefone = normalizarTelefoneCheckout(dados.telefone);
  const produtosIds = [...new Set(dados.itens.map((item) => item.produtoId))];

  const pedidoCriado = await criarPedidoCheckoutVisitanteInterno({
    dados,
    email,
    documento,
    telefone,
    produtosIds,
  });

  if (dados.formaPagamento === "cartao") {
    try {
      const checkoutStripe = await criarCheckoutCartaoStripe({
        pedidoId: pedidoCriado.pedidoId,
        pagamentoId: pedidoCriado.pagamentoId,
        numeroPedido: pedidoCriado.numeroPedido,
        email,
        totalEmCentavos: pedidoCriado.totalEmCentavos,
        quantidadeItens: dados.itens.reduce(
          (total, item) => total + item.quantidade,
          0,
        ),
      });

      await dbTransacional
        .update(checkoutPagamentosTable)
        .set({
          transactionId: checkoutStripe.sessionId,
          providerResponse: {
            stripeCheckoutSession: checkoutStripe.providerResponse,
          },
          updatedAt: new Date(),
        })
        .where(eq(checkoutPagamentosTable.id, pedidoCriado.pagamentoId));

      return {
        ...montarRetornoPedidoCheckout(pedidoCriado),
        stripe: {
          sessionId: checkoutStripe.sessionId,
          url: checkoutStripe.url,
        },
      };
    } catch (error) {
      await marcarFalhaPagamentoGateway({
        pedidoId: pedidoCriado.pedidoId,
        pagamentoId: pedidoCriado.pagamentoId,
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao criar checkout Stripe.",
      });

      throw error;
    }
  }

  try {
    const pix = await criarCobrancaPixEfi({
      numeroPedido: pedidoCriado.numeroPedido,
      nome: pedidoCriado.nomeCliente,
      documento: pedidoCriado.documentoCliente,
      valorEmCentavos: pedidoCriado.totalEmCentavos,
    });

    await dbTransacional
      .update(checkoutPagamentosTable)
      .set({
        pixTxid: pix.txid,
        transactionId: pix.txid,
        qrCode: pix.qrCode,
        copiaECola: pix.copiaECola,
        expiresAt: pix.expiresAt,
        providerResponse: pix.providerResponse,
        updatedAt: new Date(),
      })
      .where(eq(checkoutPagamentosTable.id, pedidoCriado.pagamentoId));

    return {
      ...montarRetornoPedidoCheckout(pedidoCriado),
      pix: {
        txid: pix.txid,
        qrCode: pix.qrCode,
        copiaECola: pix.copiaECola,
        expiresAt: pix.expiresAt.toISOString(),
      },
    };
  } catch (error) {
    await marcarFalhaPagamentoGateway({
      pedidoId: pedidoCriado.pedidoId,
      pagamentoId: pedidoCriado.pagamentoId,
      erro:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao criar Pix Efí.",
    });

    throw error;
  }
}

async function marcarFalhaPagamentoGateway({
  pedidoId,
  pagamentoId,
  erro,
}: {
  pedidoId: string;
  pagamentoId: string;
  erro: string;
}) {
  await dbTransacional.transaction(async (tx) => {
    await tx
      .update(checkoutPagamentosTable)
      .set({
        status: "failed",
        providerResponse: {
          erro,
        },
        updatedAt: new Date(),
      })
      .where(eq(checkoutPagamentosTable.id, pagamentoId));

    await tx
      .update(checkoutPedidosTable)
      .set({
        pagamentoStatus: "failed",
        updatedAt: new Date(),
      })
      .where(eq(checkoutPedidosTable.id, pedidoId));
  });
}

type CriarPedidoCheckoutVisitanteInternoParams = {
  dados: CheckoutVisitanteSchema;
  email: string;
  documento: string;
  telefone: string;
  produtosIds: string[];
};

async function criarPedidoCheckoutVisitanteInterno({
  dados,
  email,
  documento,
  telefone,
  produtosIds,
}: CriarPedidoCheckoutVisitanteInternoParams) {
  return dbTransacional.transaction(async (tx) => {
    const produtos = await tx.query.productTable.findMany({
      where: inArray(productTable.id, produtosIds),
      with: {
        pricing: true,
      },
    });

    const itensPedido = dados.itens.map((item) => {
      const produto = produtos.find(
        (produtoAtual) => produtoAtual.id === item.produtoId,
      );

      if (!produto) {
        throw new Error(`Produto não encontrado: ${item.nome}`);
      }

      return montarSnapshotItemPedidoCheckout({ item, produto });
    });

    const frete = calcularFreteCheckout(dados.freteId);
    const totais = calcularTotalCheckout({
      itens: itensPedido.map((item) => ({
        precoEmCentavos: item.precoUnitarioEmCentavos,
        quantidade: item.quantidade,
      })),
      freteEmCentavos: frete.valorEmCentavos,
      cupom: dados.cupom,
    });

    if (totais.totalEmCentavos <= 0) {
      throw new Error("Total do checkout inválido");
    }

    const clienteExistente = await tx.query.checkoutClientesTable.findFirst({
      where: or(
        eq(checkoutClientesTable.email, email),
        eq(checkoutClientesTable.documento, documento),
      ),
    });

    const cliente =
      clienteExistente ??
      (
        await tx
          .insert(checkoutClientesTable)
          .values({
            nome: dados.nome.trim(),
            email,
            telefone,
            documento,
          })
          .returning()
      )[0];

    if (!cliente) {
      throw new Error("Não foi possível criar o cliente do pedido.");
    }

    const endereco = (
      await tx
        .insert(checkoutEnderecosTable)
        .values({
          clienteId: cliente.id,
          cep: dados.cep.replace(/\D/g, ""),
          rua: dados.rua.trim(),
          numero: dados.numero.trim(),
          complemento: normalizarTextoOpcionalCheckout(dados.complemento),
          bairro: dados.bairro.trim(),
          cidade: dados.cidade.trim(),
          estado: dados.estado.trim().toUpperCase(),
          observacao: normalizarTextoOpcionalCheckout(dados.observacao),
        })
        .returning()
    )[0];

    if (!endereco) {
      throw new Error("Não foi possível salvar o endereço do pedido.");
    }

    const numeroPedidoResultado = await tx.execute<LinhaNumeroPedido>(sql`
      select '#' || nextval('checkout_pedidos_numero_pedido_seq')::text as "numeroPedido"
    `);
    const numeroPedido = numeroPedidoResultado.rows[0]?.numeroPedido;

    if (!numeroPedido) {
      throw new Error("Não foi possível gerar o número do pedido.");
    }

    const gatewayPagamento = resolverGatewayPagamento(dados.formaPagamento);
    const pedido = (
      await tx
        .insert(checkoutPedidosTable)
        .values({
          numeroPedido,
          clienteId: cliente.id,
          enderecoId: endereco.id,
          status: "pending",
          subtotalEmCentavos: totais.subtotalEmCentavos,
          freteEmCentavos: totais.freteEmCentavos,
          descontoEmCentavos: totais.descontoEmCentavos,
          totalEmCentavos: totais.totalEmCentavos,
          gatewayPagamento,
          pagamentoStatus: "pending",
          observacao: normalizarTextoOpcionalCheckout(dados.observacao),
        })
        .returning()
    )[0];

    if (!pedido) {
      throw new Error("Não foi possível criar o pedido.");
    }

    await tx.insert(checkoutPedidoItensTable).values(
      itensPedido.map((item) => ({
        pedidoId: pedido.id,
        ...item,
      })),
    );

    const pagamento = (
      await tx
        .insert(checkoutPagamentosTable)
        .values({
          pedidoId: pedido.id,
          gateway: gatewayPagamento,
          metodo: dados.formaPagamento,
          status: "pending",
          valorEmCentavos: totais.totalEmCentavos,
          providerResponse: null,
        })
        .returning()
    )[0];

    if (!pagamento) {
      throw new Error("Não foi possível criar o pagamento do pedido.");
    }

    return {
      clienteId: cliente.id,
      enderecoId: endereco.id,
      pedidoId: pedido.id,
      pagamentoId: pagamento.id,
      numeroPedido: pedido.numeroPedido,
      status: pedido.status,
      pagamentoStatus: pagamento.status,
      totalEmCentavos: totais.totalEmCentavos,
      nomeCliente: cliente.nome,
      documentoCliente: cliente.documento,
    };
  });
}
