"use server";

import { eq, inArray, sql } from "drizzle-orm";

import {
  checkoutClientesTable,
  checkoutEnderecosTable,
  checkoutPagamentosTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidoItensTable,
  checkoutPedidoLogisticasTable,
  checkoutPedidoPagamentoEntregaTable,
  checkoutPedidosTable,
  productTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";
import { listarProvedoresExpedicaoProdutos } from "@/features/fornecedores/queries/listar-provedores-expedicao-produtos";
import { buscarDisponibilidadeFreteProduto } from "@/features/logistica/queries/disponibilidade/buscar-disponibilidade-frete-produto";
import {
  avaliarConsistenciaTrocoPedido,
  type FormaPagamentoNaEntrega,
  type ResultadoAvaliacaoPagamentoNaEntrega,
} from "@/features/pagamento-na-entrega";
import { avaliarPagamentoNaEntregaComBanco } from "@/features/pagamento-na-entrega/queries/avaliar-pagamento-na-entrega-checkout";
import {
  buscarConfiguracaoPagamentoAtiva,
  calcularParcelamentosCartao,
} from "@/features/precificacao/server";
import { extrairCodigosFretePromocionalDeSnapshot } from "@/features/promocoes/lib/codigos-frete-promocional";

import { montarDescricaoPedidoCriado } from "../../lib/admin-pedidos/montar-descricao-historico-pedido";
import {
  enviarEmailPedidoRecebido,
  enviarEmailPixPendente,
} from "../../lib/emails/email-service";
import { criarConsultaEntregaPropriaCheckout } from "../../lib/frete/criar-consulta-entrega-propria-checkout";
import { montarRegistroSnapshotFretePedido } from "../../lib/frete/montar-registro-snapshot-frete-pedido";
import { revalidarFreteCheckout } from "../../lib/frete/revalidar-frete-checkout";
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
import { calcularPreviaTotaisPedido } from "../../queries/previa-totais/calcular-previa-totais-pedido";
import {
  type CheckoutVisitanteSchema,
  checkoutVisitanteSchema,
} from "../../schemas/checkout.schema";

type LinhaNumeroPedido = {
  numeroPedido: string;
};

/**
 * Reconstrói, a partir do banco, o retorno de um pedido que já existia.
 *
 * Usado quando a chave de idempotência bate: o pedido não é recriado, e quem chamou recebe
 * exatamente o mesmo formato de sempre, com `jaExistia` marcando que nada foi gravado
 * agora. É esse sinalizador que evita reenviar e-mail e recriar cobrança no gateway.
 */
async function montarRetornoPedidoExistente(
  executor: Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0],
  pedido: typeof checkoutPedidosTable.$inferSelect,
) {
  const [cliente] = await executor
    .select()
    .from(checkoutClientesTable)
    .where(eq(checkoutClientesTable.id, pedido.clienteId))
    .limit(1);

  const [pagamento] = await executor
    .select()
    .from(checkoutPagamentosTable)
    .where(eq(checkoutPagamentosTable.pedidoId, pedido.id))
    .limit(1);

  const itens = await executor
    .select()
    .from(checkoutPedidoItensTable)
    .where(eq(checkoutPedidoItensTable.pedidoId, pedido.id));

  if (!cliente || !pagamento) {
    throw new Error("Pedido existente incompleto para reaproveitamento.");
  }

  return {
    jaExistia: true as const,
    clienteId: pedido.clienteId,
    enderecoId: pedido.enderecoId,
    pedidoId: pedido.id,
    pagamentoId: pagamento.id,
    numeroPedido: pedido.numeroPedido,
    status: pedido.status,
    pagamentoStatus: pagamento.status,
    totalEmCentavos: pedido.totalEmCentavos,
    subtotalEmCentavos: pedido.subtotalEmCentavos,
    freteEmCentavos: pedido.freteEmCentavos,
    descontoEmCentavos: pedido.descontoEmCentavos,
    nomeCliente: cliente.nome,
    emailCliente: cliente.email,
    documentoCliente: cliente.documento,
    pagamentoExistente: pagamento,
    itens: itens.map((item) => ({
      nome: item.nomeProduto,
      quantidade: item.quantidade,
      precoUnitarioEmCentavos: item.precoUnitarioEmCentavos,
      totalEmCentavos: item.totalEmCentavos,
    })),
  };
}

type FormaPagamentoCheckout = CheckoutVisitanteSchema["formaPagamento"];

/**
 * Canal de liquidação de cada forma.
 *
 * `manual` não é um gateway de verdade: o dinheiro entra na mão do entregador e um admin
 * dá baixa depois. É esse valor que distingue, em consulta, um pedido pago na entrega de
 * um pedido online — sem precisar de status novo.
 */
function resolverGatewayPagamento(formaPagamento: FormaPagamentoCheckout) {
  if (formaPagamento === "naEntrega") return "manual" as const;
  return formaPagamento === "pix" ? ("efibank" as const) : ("stripe" as const);
}

/**
 * Qual tabela de preço usar ao montar os itens.
 *
 * Pagar na entrega não tem acréscimo de gateway, então usa o preço do PIX. Repassar o
 * preço do cartão seria cobrar juros de uma maquininha que a loja não opera.
 */
function resolverFormaPagamentoParaPreco(
  formaPagamento: FormaPagamentoCheckout,
): "pix" | "cartao" {
  return formaPagamento === "cartao" ? "cartao" : "pix";
}

/** Método gravado em `checkout_pagamentos.metodo`. */
function resolverMetodoPagamento(dados: CheckoutVisitanteSchema) {
  if (dados.formaPagamento !== "naEntrega") return dados.formaPagamento;

  if (dados.formaPagamentoNaEntrega === undefined) {
    throw new Error("Escolha como vai pagar na entrega.");
  }

  return dados.formaPagamentoNaEntrega;
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

  // Retry da mesma chave: o pedido já existia, então nada foi gravado agora. Reenviar
  // e-mail ou recriar cobrança faria o cliente receber tudo em duplicidade.
  if (pedidoCriado.jaExistia) {
    const pagamento = pedidoCriado.pagamentoExistente;

    if (pagamento?.gateway === "efibank" && pagamento.qrCode) {
      return {
        ...montarRetornoPedidoCheckout(pedidoCriado),
        pix: {
          txid: pagamento.pixTxid ?? "",
          qrCode: pagamento.qrCode,
          copiaECola: pagamento.copiaECola ?? "",
          expiresAt: (pagamento.expiresAt ?? new Date()).toISOString(),
        },
      };
    }

    return montarRetornoPedidoCheckout(pedidoCriado);
  }

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

  // Pagamento na entrega não passa por gateway nenhum: não há cobrança a criar, não há
  // QR Code, não há sessão de cartão. O pedido nasce pendente e a baixa é manual.
  if (dados.formaPagamento === "naEntrega") {
    return montarRetornoPedidoCheckout(pedidoCriado);
  }

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

/**
 * Núcleo transacional da criação do pedido.
 *
 * Exportado para poder ser exercitado fora de uma requisição HTTP. A action pública chama
 * `headers()` (para ler a sessão), o que só funciona dentro do escopo de request do Next —
 * então testar por ela impediria verificar justamente a parte crítica: a reavaliação da
 * elegibilidade e a gravação, que vivem aqui.
 */
export async function criarPedidoCheckoutVisitanteInterno({
  dados,
  email,
  documento,
  telefone,
  produtosIds,
  usuarioId,
}: CriarPedidoCheckoutVisitanteInternoParams) {
  return dbTransacional.transaction(async (tx) => {
    /**
     * Primeira camada de idempotência: a mesma chave já criou pedido?
     *
     * Sem isto, um duplo clique gera dois pedidos. Com PIX o estrago é contido — o segundo
     * expira sozinho. Com pagamento na entrega são dois pedidos válidos, e alguém entrega
     * a mercadoria duas vezes.
     *
     * Devolver o pedido existente, em vez de erro, é o comportamento correto para um
     * retry: do ponto de vista de quem chamou, a operação teve sucesso — e teve mesmo.
     */
    if (dados.chaveIdempotencia) {
      const [pedidoExistente] = await tx
        .select()
        .from(checkoutPedidosTable)
        .where(
          eq(checkoutPedidosTable.chaveIdempotencia, dados.chaveIdempotencia),
        )
        .limit(1);

      if (pedidoExistente) {
        return await montarRetornoPedidoExistente(tx, pedidoExistente);
      }
    }

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
        formaPagamento: resolverFormaPagamentoParaPreco(dados.formaPagamento),
        configuracaoPagamento,
      });
    });

    const provedoresExpedicaoPorProdutoId =
      await listarProvedoresExpedicaoProdutos(produtosIds);

    const revalidacaoFrete = await revalidarFreteCheckout({
      itens: dados.itens,
      produtos,
      cepFinal: dados.cep,
      dependencias: {
        consultarEntregaPropriaAtual: criarConsultaEntregaPropriaCheckout(),
        buscarDisponibilidadeFreteProduto,
        provedoresExpedicaoPorProdutoId,
      },
    });

    if (!revalidacaoFrete.sucesso) {
      throw new Error(revalidacaoFrete.mensagem);
    }

    const previaTotaisPedido = await calcularPreviaTotaisPedido({
      itens: dados.itens,
      codigoCupom: dados.cupom,
      clienteId: usuarioId,
      freteEmCentavosOficial: revalidacaoFrete.freteEmCentavos,
      aplicarFreteGratisPromocional: true,
      cepEntrega: dados.cep,
      cidadeEntrega: dados.cidade,
      estadoEntrega: dados.estado,
      fretesSelecionadosCodigos: extrairCodigosFretePromocionalDeSnapshot(
        revalidacaoFrete.snapshotFrete,
      ),
    });

    if (!previaTotaisPedido) {
      throw new Error(
        "Não foi possível calcular os totais oficiais do pedido.",
      );
    }

    const totaisPreviaForma =
      previaTotaisPedido.totaisPorFormaPagamento[dados.formaPagamento];
    const cupomAplicado = previaTotaisPedido.cupom?.valido
      ? previaTotaisPedido.cupom
      : null;
    const descontoPromocionalEmCentavos =
      totaisPreviaForma.descontoPromocionalEmCentavos;
    const descontoCupomEmCentavos = totaisPreviaForma.descontoCupomEmCentavos;
    const freteGratisPromocionalPedido =
      previaTotaisPedido.freteGratisPromocional;
    const descontoFretePromocionalEmCentavos =
      freteGratisPromocionalPedido.descontoFretePromocionalEmCentavos;
    const descontoTotalEmCentavos =
      descontoCupomEmCentavos + descontoFretePromocionalEmCentavos;
    const parcelamentosCartao = calcularParcelamentosCartao({
      valorEmCentavos: totaisPreviaForma.totalEstimadoEmCentavos,
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
      subtotalEmCentavos: totaisPreviaForma.subtotalEmCentavos,
      freteEmCentavos: totaisPreviaForma.freteEmCentavos,
      descontoEmCentavos: descontoTotalEmCentavos,
      descontoPromocionalEmCentavos,
      descontoCupomEmCentavos,
      economiaTotalEmCentavos: totaisPreviaForma.economiaEmCentavos,
      totalEmCentavos:
        parcelamentoSelecionado?.totalEmCentavos ??
        totaisPreviaForma.totalEstimadoEmCentavos,
      codigoCupomAplicado: cupomAplicado?.codigo ?? null,
      snapshotDescontos: {
        origem: "calcularPreviaTotaisPedido",
        formaPagamento: dados.formaPagamento,
        descontoPromocionalEmCentavos,
        descontoCupomEmCentavos,
        descontoFretePromocionalEmCentavos,
        economiaTotalEmCentavos: totaisPreviaForma.economiaEmCentavos,
        valorFreteOriginalEmCentavos:
          freteGratisPromocionalPedido.valorFreteOriginalEmCentavos,
        valorFreteFinalEmCentavos:
          freteGratisPromocionalPedido.valorFreteFinalEmCentavos,
        totalEstimadoSemJurosEmCentavos:
          totaisPreviaForma.totalEstimadoEmCentavos,
        totalFinalEmCentavos:
          parcelamentoSelecionado?.totalEmCentavos ??
          totaisPreviaForma.totalEstimadoEmCentavos,
        cupom: cupomAplicado
          ? {
              codigo: cupomAplicado.codigo,
              tipoDesconto: cupomAplicado.tipoDesconto,
              valorDesconto: cupomAplicado.valorDesconto,
              descontoEstimadoEmCentavos:
                cupomAplicado.descontoEstimadoEmCentavos,
            }
          : null,
        freteGratisPromocional: {
          elegivel: freteGratisPromocionalPedido.elegivel,
          aplicado: freteGratisPromocionalPedido.freteGratisPromocionalAplicado,
          valorFreteOriginalEmCentavos:
            freteGratisPromocionalPedido.valorFreteOriginalEmCentavos,
          valorFreteFinalEmCentavos:
            freteGratisPromocionalPedido.valorFreteFinalEmCentavos,
          descontoFretePromocionalEmCentavos:
            freteGratisPromocionalPedido.descontoFretePromocionalEmCentavos,
          regraFreteGratisAplicada:
            freteGratisPromocionalPedido.regraFreteGratisAplicada,
          modalidadeAplicada: freteGratisPromocionalPedido.modalidadeAplicada,
          modalidadesElegiveis:
            freteGratisPromocionalPedido.modalidadesElegiveis,
          formaEntregaAplicada:
            freteGratisPromocionalPedido.formaEntregaAplicada,
          formasEntregaElegiveis:
            freteGratisPromocionalPedido.formasEntregaElegiveis,
          regiaoAplicada: freteGratisPromocionalPedido.regiaoAplicada,
          regioesElegiveis: freteGratisPromocionalPedido.regioesElegiveis,
          transportadoraAplicada:
            freteGratisPromocionalPedido.transportadoraAplicada,
          servicoAplicado: freteGratisPromocionalPedido.servicoAplicado,
          fretesSelecionadosElegiveis:
            freteGratisPromocionalPedido.fretesSelecionadosElegiveis,
          tipoPrioridadeFreteGratis:
            freteGratisPromocionalPedido.tipoPrioridadeFreteGratis,
          regrasIgnoradasPorPrecedencia:
            freteGratisPromocionalPedido.regrasIgnoradasPorPrecedencia,
          observacao:
            "Frete promocional aplicado no total financeiro do pedido.",
        },
      },
    };

    /**
     * Reavaliação vinculante do pagamento na entrega.
     *
     * Acontece aqui dentro, na mesma transação que grava o pedido, e a partir de dados que
     * o servidor acabou de produzir:
     *
     * - o serviço de entrega vem de `revalidacaoFrete.snapshotFrete`, nunca do carrinho —
     *   o carrinho mora no localStorage e o usuário consegue editar o campo `servico`;
     * - o total é `totais.totalEmCentavos`, o oficial recém-calculado, não o exibido na tela;
     * - produto, variante e modalidade são relidos do banco pelo adaptador.
     *
     * Nada do que o frontend afirmou sobre elegibilidade é considerado. A avaliação feita
     * no Bloco 6 servia para exibir a opção; esta é a que autoriza.
     */
    let avaliacaoNaEntrega: ResultadoAvaliacaoPagamentoNaEntrega | null = null;

    if (dados.formaPagamento === "naEntrega") {
      avaliacaoNaEntrega = await avaliarPagamentoNaEntregaComBanco(
        {
          contexto: "checkout",
          itens: revalidacaoFrete.snapshotFrete.itens.map((item) => ({
            itemCarrinhoId: item.itemCarrinhoId,
            produtoId: item.produtoId,
            varianteId: item.varianteId,
            // CUIDADO com a colisão de nomes: `item.modalidade` no snapshot de frete é a
            // modalidade de ENTREGA ("entrega-propria", "retirada", "frenet"), não a
            // modalidade comercial ("stock", "pre_sale"). A comercial só existe no item do
            // carrinho — e por vir do cliente, o carregador do contexto a confere contra
            // `product_pricing` antes de repassá-la ao motor. Valor forjado não passa.
            modalidadeInformada:
              dados.itens.find((linha) => linha.id === item.itemCarrinhoId)
                ?.modalidadeTipo ?? null,
            frete: {
              provedor: item.provedor,
              servico: item.servico,
              cepCotado: revalidacaoFrete.snapshotFrete.cep,
            },
          })),
          totalPedidoEmCentavos: totais.totalEmCentavos,
          cepEntrega: dados.cep,
        },
        tx,
      );

      if (!avaliacaoNaEntrega.elegivel) {
        throw new Error(
          avaliacaoNaEntrega.motivos[0]?.mensagem ??
            "Pagamento na entrega indisponível para este pedido.",
        );
      }

      const formaEscolhida = resolverMetodoPagamento(dados);

      // A forma tem de estar entre as que o motor liberou AGORA. O teto de dinheiro, por
      // exemplo, pode ter derrubado "dinheiro" entre a exibição e a finalização.
      if (
        !avaliacaoNaEntrega.formasPermitidas.includes(
          formaEscolhida as FormaPagamentoNaEntrega,
        )
      ) {
        throw new Error(
          "A forma de pagamento na entrega escolhida não está disponível para este pedido.",
        );
      }

      const consistenciaTroco = avaliarConsistenciaTrocoPedido({
        formaEscolhida: formaEscolhida as FormaPagamentoNaEntrega,
        precisaTroco: dados.precisaTroco ?? false,
        trocoParaEmCentavos: dados.trocoParaEmCentavos ?? null,
        valorAReceberEmCentavos: totais.totalEmCentavos,
        totalAtualDoPedidoEmCentavos: totais.totalEmCentavos,
      });

      if (!consistenciaTroco.consistente) {
        throw new Error(
          consistenciaTroco.problemas[0]?.mensagem ?? "Troco inválido.",
        );
      }
    }

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
          chaveIdempotencia: dados.chaveIdempotencia ?? null,
          clienteId: cliente.id,
          enderecoId: endereco.id,
          status: "pending",
          subtotalEmCentavos: totais.subtotalEmCentavos,
          freteEmCentavos: totais.freteEmCentavos,
          descontoEmCentavos: totais.descontoEmCentavos,
          descontoPromocionalEmCentavos: totais.descontoPromocionalEmCentavos,
          descontoCupomEmCentavos: totais.descontoCupomEmCentavos,
          economiaTotalEmCentavos: totais.economiaTotalEmCentavos,
          totalEmCentavos: totais.totalEmCentavos,
          codigoCupomAplicado: totais.codigoCupomAplicado,
          snapshotDescontos: totais.snapshotDescontos,
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

    // Snapshot da decisão, congelado junto do pedido.
    //
    // Congelar em vez de recalcular na leitura porque a configuração muda com o tempo: se
    // o gestor baixar o teto de dinheiro amanhã, um pedido criado hoje dentro da regra
    // antiga continua legítimo — e o admin precisa enxergar qual regra o autorizou.
    if (dados.formaPagamento === "naEntrega" && avaliacaoNaEntrega !== null) {
      const formaEscolhida = resolverMetodoPagamento(
        dados,
      ) as FormaPagamentoNaEntrega;

      await tx.insert(checkoutPedidoPagamentoEntregaTable).values({
        pedidoId: pedido.id,
        formaEscolhida,
        servicoFreteId: avaliacaoNaEntrega.servico?.servicoFreteId ?? null,
        // Denormalizado: sobrevive à exclusão do serviço e evita join na leitura.
        servicoIdentificador: avaliacaoNaEntrega.servico?.identificador ?? "",
        valorAReceberEmCentavos: totais.totalEmCentavos,
        precisaTroco: dados.precisaTroco ?? false,
        trocoParaEmCentavos: dados.precisaTroco
          ? (dados.trocoParaEmCentavos ?? null)
          : null,
        observacoesCliente:
          avaliacaoNaEntrega.regrasAplicadas?.observacoesCliente ?? null,
        snapshotElegibilidade: avaliacaoNaEntrega,
      });
    }

    const pagamento = (
      await tx
        .insert(checkoutPagamentosTable)
        .values({
          pedidoId: pedido.id,
          gateway: gatewayPagamento,
          metodo: resolverMetodoPagamento(dados),
          // "pending" também aqui: o dinheiro só entra na entrega. A baixa é manual e
          // acontece no bloco seguinte — este bloco não contabiliza recebimento.
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
      jaExistia: false as const,
      pagamentoExistente: null,
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
