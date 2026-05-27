"use server";

import { eq, inArray, or, sql } from "drizzle-orm";

import { dbTransacional } from "@/db/transaction";
import {
  checkoutClientesTable,
  checkoutEnderecosTable,
  checkoutPagamentosTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidoItensTable,
  checkoutPedidoLogisticasTable,
  checkoutPedidosTable,
  productTable,
} from "@/db/schema";
import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";
import { buscarDisponibilidadeFreteProduto } from "@/features/logistica/queries/disponibilidade/buscar-disponibilidade-frete-produto";
import {
  buscarConfiguracaoPagamentoAtiva,
  calcularParcelamentosCartao,
} from "@/features/precificacao";

import { calcularTotalCheckout } from "../../lib/calcular-total-checkout";
import {
  enviarEmailPedidoRecebido,
  enviarEmailPixPendente,
} from "../../lib/emails/email-service";
import { montarDescricaoPedidoCriado } from "../../lib/admin-pedidos/montar-descricao-historico-pedido";
import { criarCobrancaPixEfi } from "../../lib/gateways/efi/pix-efi";
import { criarCheckoutCartaoStripe } from "../../lib/gateways/stripe/checkout-stripe";
import {
  montarSnapshotItemPedidoCheckout,
  normalizarDocumentoCheckout,
  normalizarEmailCheckout,
  normalizarTelefoneCheckout,
  normalizarTextoOpcionalCheckout,
} from "../../lib/pedidos/normalizar-checkout-visitante";
import { criarConsultaEntregaPropriaCheckout } from "../../lib/frete/criar-consulta-entrega-propria-checkout";
import { revalidarFreteCheckout } from "../../lib/frete/revalidar-frete-checkout";
import { montarRegistroSnapshotFretePedido } from "../../lib/frete/montar-registro-snapshot-frete-pedido";
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
  const sessao = await buscarSessaoCliente();

  if (!isValidNome(dados.nome)) {
    throw new Error("Nome inválido");
  }

  if (!isValidTelefone(dados.telefone)) {
    throw new Error("Telefone inválido");
  }

  if (!isValidCPFOrCNPJ(dados.documento)) {
    throw new Error("Documento CPF ou CNPJ inválido");
  }

  const email = normalizarEmailCheckout(sessao?.usuario.email ?? dados.email);
  const documento = normalizarDocumentoCheckout(dados.documento);
  const telefone = normalizarTelefoneCheckout(dados.telefone);
  const produtosIds = [...new Set(dados.itens.map((item) => item.produtoId))];

  const pedidoCriado = await criarPedidoCheckoutVisitanteInterno({
    dados,
    email,
    documento,
    telefone,
    produtosIds,
    usuarioId: sessao?.usuario.id ?? null,
  });

  await enviarEmailPedidoRecebido({
    numeroPedido: pedidoCriado.numeroPedido,
    nomeCliente: pedidoCriado.nomeCliente,
    emailCliente: pedidoCriado.emailCliente,
    subtotalEmCentavos: pedidoCriado.subtotalEmCentavos,
    freteEmCentavos: pedidoCriado.freteEmCentavos,
    descontoEmCentavos: pedidoCriado.descontoEmCentavos,
    totalEmCentavos: pedidoCriado.totalEmCentavos,
    itens: pedidoCriado.itens,
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

    await enviarEmailPixPendente({
      numeroPedido: pedidoCriado.numeroPedido,
      nomeCliente: pedidoCriado.nomeCliente,
      emailCliente: pedidoCriado.emailCliente,
      subtotalEmCentavos: pedidoCriado.subtotalEmCentavos,
      freteEmCentavos: pedidoCriado.freteEmCentavos,
      descontoEmCentavos: pedidoCriado.descontoEmCentavos,
      totalEmCentavos: pedidoCriado.totalEmCentavos,
      itens: pedidoCriado.itens,
      pix: {
        qrCode: pix.qrCode,
        copiaECola: pix.copiaECola,
        expiresAt: pix.expiresAt,
      },
    });

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
  usuarioId: string | null;
};

async function criarPedidoCheckoutVisitanteInterno({
  dados,
  email,
  documento,
  telefone,
  produtosIds,
  usuarioId,
}: CriarPedidoCheckoutVisitanteInternoParams) {
  return dbTransacional.transaction(async (tx) => {
    const configuracaoPagamento = await buscarConfiguracaoPagamentoAtiva();
    const produtos = await tx.query.productTable.findMany({
      where: inArray(productTable.id, produtosIds),
      with: {
        pricing: true,
        galleryImages: true,
        variants: true,
        modeloRetirada: true,
      },
    });

    const itensPedido = dados.itens.map((item) => {
      const produto = produtos.find(
        (produtoAtual) => produtoAtual.id === item.produtoId,
      );

      if (!produto) {
        throw new Error(`Produto não encontrado: ${item.nome}`);
      }

      return montarSnapshotItemPedidoCheckout({
        item,
        produto,
        formaPagamento: dados.formaPagamento,
        configuracaoPagamento,
      });
    });

    const revalidacaoFrete = await revalidarFreteCheckout({
      itens: dados.itens,
      produtos,
      cepFinal: dados.cep,
      dependencias: {
        consultarEntregaPropriaAtual: criarConsultaEntregaPropriaCheckout(),
        buscarDisponibilidadeFreteProduto,
      },
    });

    if (!revalidacaoFrete.sucesso) {
      throw new Error(revalidacaoFrete.mensagem);
    }

    const freteEmCentavos = revalidacaoFrete.freteEmCentavos;
    const totaisBase = calcularTotalCheckout({
      itens: itensPedido.map((item) => ({
        precoEmCentavos: item.precoUnitarioEmCentavos,
        quantidade: item.quantidade,
      })),
      freteEmCentavos,
      cupom: dados.cupom,
    });
    const parcelamentosCartao = calcularParcelamentosCartao({
      valorEmCentavos: totaisBase.totalEmCentavos,
      configuracao: configuracaoPagamento,
    });
    const parcelamentoSelecionado =
      dados.formaPagamento === "cartao"
        ? parcelamentosCartao.find(
            (parcelamento) =>
              parcelamento.parcelas === (dados.parcelasCartao ?? 1),
          ) || parcelamentosCartao[0]
        : null;
    const totais = {
      ...totaisBase,
      totalEmCentavos:
        parcelamentoSelecionado?.totalEmCentavos ?? totaisBase.totalEmCentavos,
    };

    if (totais.totalEmCentavos <= 0) {
      throw new Error("Total do checkout inválido");
    }

    const clientePorDocumento = await tx.query.checkoutClientesTable.findFirst({
      where: eq(checkoutClientesTable.documento, documento),
    });
    const clientePorUsuario = usuarioId
      ? await tx.query.checkoutClientesTable.findFirst({
          where: eq(checkoutClientesTable.userId, usuarioId),
        })
      : null;
    const clientePorEmail = await tx.query.checkoutClientesTable.findFirst({
      where: eq(checkoutClientesTable.email, email),
    });
    const clienteExistente =
      clientePorDocumento ?? clientePorUsuario ?? clientePorEmail;

    if (
      usuarioId &&
      clienteExistente?.userId &&
      clienteExistente.userId !== usuarioId
    ) {
      throw new Error("Este CPF/CNPJ já está vinculado a outra conta.");
    }

    const dadosCliente = {
      userId: usuarioId ?? clienteExistente?.userId ?? null,
      nome: dados.nome.trim(),
      email,
      telefone,
      documento,
      updatedAt: new Date(),
    };

    const cliente = clienteExistente
      ? (
          await tx
            .update(checkoutClientesTable)
            .set(dadosCliente)
            .where(eq(checkoutClientesTable.id, clienteExistente.id))
            .returning()
        )[0]
      : (
          await tx
            .insert(checkoutClientesTable)
            .values(dadosCliente)
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
          observacaoCliente: normalizarTextoOpcionalCheckout(
            dados.observacaoCliente,
          ),
          autorizarEntregaVizinho: Boolean(dados.permitirEntregaVizinho),
          nomeVizinho: dados.permitirEntregaVizinho
            ? normalizarTextoOpcionalCheckout(dados.nomeVizinho)
            : null,
          observacaoVizinho: dados.permitirEntregaVizinho
            ? normalizarTextoOpcionalCheckout(dados.observacaoVizinho)
            : null,
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

    await tx.insert(checkoutPedidoLogisticasTable).values(
      montarRegistroSnapshotFretePedido({
        pedidoId: pedido.id,
        snapshot: revalidacaoFrete.snapshotFrete,
      }),
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

    await tx.insert(checkoutPedidoHistoricosTable).values({
      pedidoId: pedido.id,
      tipo: "pedido_criado",
      descricao: montarDescricaoPedidoCriado(pedido.numeroPedido),
      origem: "system",
      statusNovo: pedido.status,
      metadata: {
        formaPagamento: dados.formaPagamento,
      },
    });

    return {
      clienteId: cliente.id,
      enderecoId: endereco.id,
      pedidoId: pedido.id,
      pagamentoId: pagamento.id,
      numeroPedido: pedido.numeroPedido,
      status: pedido.status,
      pagamentoStatus: pagamento.status,
      totalEmCentavos: totais.totalEmCentavos,
      subtotalEmCentavos: totais.subtotalEmCentavos,
      freteEmCentavos: totais.freteEmCentavos,
      descontoEmCentavos: totais.descontoEmCentavos,
      nomeCliente: cliente.nome,
      emailCliente: cliente.email,
      documentoCliente: cliente.documento,
      itens: itensPedido.map((item) => ({
        nome: item.nomeProduto,
        quantidade: item.quantidade,
        precoUnitarioEmCentavos: item.precoUnitarioEmCentavos,
        totalEmCentavos: item.totalEmCentavos,
      })),
    };
  });
}
