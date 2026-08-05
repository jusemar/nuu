"use server";

import { inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";
import type { ItemCarrinho } from "@/features/carrinho";
import { avaliarPagamentoNaEntregaComBanco } from "@/features/pagamento-na-entrega/queries/avaliar-pagamento-na-entrega-checkout";
import {
  buscarConfiguracaoPagamentoAtiva,
  calcularParcelamentosCartao,
  calcularPrecoProduto,
  formatarPrecoEmReais,
  normalizarModalidadePrecoCanonica,
} from "@/features/precificacao/server";

import { calcularTotalCheckout } from "../../lib/calcular-total-checkout";
import { resolverItemVendavelCheckout } from "../../lib/pedidos/normalizar-checkout-visitante";
import {
  calcularFreteItensCheckout,
  resolverFreteItemCheckout,
} from "../../lib/resumo-checkout/calcular-frete-itens-checkout";
import type { ResumoCheckoutCalculado } from "../../types/checkout.types";

type CalcularResumoCheckoutParams = {
  itens: ItemCarrinho[];
  cupom?: string;
  /**
   * CEP digitado no checkout. Só chega aqui quando está completo — ver o efeito em
   * `checkout-visitante.tsx`, que evita recalcular a cada tecla.
   */
  cepEntrega?: string | null;
};

const configuracaoVisualModalidade: Record<
  string,
  { icone: string; badge: string; badgeBg: string; badgeColor: string }
> = {
  stock: {
    icone: "🏭",
    badge: "Estoque Próprio",
    badgeBg: "#E8F5E9",
    badgeColor: "#2E7D32",
  },
  pre_sale: {
    icone: "⏳",
    badge: "Pré-venda",
    badgeBg: "#FFF3E0",
    badgeColor: "#ED6C02",
  },
  dropshipping: {
    icone: "📦",
    badge: "Dropshipping",
    badgeBg: "#E3F2FD",
    badgeColor: "#0288D1",
  },
  order_basis: {
    icone: "📋",
    badge: "Sob Encomenda",
    badgeBg: "#F3E5F5",
    badgeColor: "#7B1FA2",
  },
};

function obterTituloModalidade({
  tipo,
  descricao,
  prazo,
}: {
  tipo: string;
  descricao: string | null;
  prazo: string | null;
}) {
  const descricaoNormalizada = descricao?.trim();
  const prazoNormalizado = prazo?.trim();

  if (descricaoNormalizada && descricaoNormalizada !== prazoNormalizado) {
    return descricaoNormalizada;
  }

  return configuracaoVisualModalidade[tipo]?.badge || tipo;
}

export async function calcularResumoCheckout({
  itens,
  cupom,
  cepEntrega = null,
}: CalcularResumoCheckoutParams): Promise<ResumoCheckoutCalculado | null> {
  if (itens.length === 0) {
    return null;
  }

  const configuracaoPagamento = await buscarConfiguracaoPagamentoAtiva();
  const produtosIds = [...new Set(itens.map((item) => item.produtoId))];
  const produtos = await db.query.productTable.findMany({
    where: inArray(productTable.id, produtosIds),
    with: {
      pricing: true,
      galleryImages: true,
      variants: true,
    },
  });

  const itensCalculados = itens.map((item) => {
    const produto = produtos.find(
      (produtoAtual) => produtoAtual.id === item.produtoId,
    );

    if (!produto) {
      throw new Error(`Produto não encontrado: ${item.nome}`);
    }

    const itemVendavel = resolverItemVendavelCheckout({ item, produto });
    const precoSelecionado =
      itemVendavel.tipo === "simple" ? itemVendavel.precoSelecionado : null;
    const precoBaseEmCentavos =
      itemVendavel.tipo === "variant"
        ? itemVendavel.variante.priceInCents
        : precoSelecionado!.hasPromo && precoSelecionado!.promoPrice
          ? precoSelecionado!.promoPrice
          : precoSelecionado!.price;
    const modalidadePreco =
      itemVendavel.tipo === "variant"
        ? `variant:${itemVendavel.variante.id}`
        : precoSelecionado!.type;
    const tipoModalidadeCanonica = normalizarModalidadePrecoCanonica(
      itemVendavel.tipo === "variant"
        ? itemVendavel.precoSelecionado?.type
        : precoSelecionado!.type,
    );
    const precos = calcularPrecoProduto({
      entrada: {
        produtoId: produto.id,
        modalidade: modalidadePreco,
        precoBaseEmCentavos,
      },
      configuracao: configuracaoPagamento,
    });
    const frete = resolverFreteItemCheckout(item);
    const visualModalidade =
      configuracaoVisualModalidade[tipoModalidadeCanonica || "stock"] ??
      configuracaoVisualModalidade.stock;
    const tituloItem =
      itemVendavel.tipo === "variant"
        ? itemVendavel.variante.name ||
          Object.values(itemVendavel.variante.attributes).join(" / ") ||
          "Variante"
        : item.modalidadeTitulo ||
          obterTituloModalidade({
            tipo: tipoModalidadeCanonica || precoSelecionado!.type,
            descricao: precoSelecionado!.pricingModalDescription,
            prazo: precoSelecionado!.deliveryDays,
          });
    const prazoModalidade =
      itemVendavel.tipo === "variant"
        ? item.prazoModalidade || "Consulte prazo"
        : precoSelecionado!.deliveryDays || "Consulte prazo";

    return {
      id: item.id,
      produtoId: produto.id,
      categoriaId: produto.categoryId,
      produtoVarianteId:
        itemVendavel.tipo === "variant"
          ? itemVendavel.variante.id
          : itemVendavel.varianteTecnica.id,
      nome: produto.name,
      sku:
        itemVendavel.tipo === "variant"
          ? itemVendavel.variante.sku
          : produto.sku,
      atributosVariante:
        itemVendavel.tipo === "variant"
          ? itemVendavel.variante.attributes
          : undefined,
      imagemUrl: itemVendavel.imagemUrl || "/produto-sem-foto.webp",
      quantidade: item.quantidade,
      modalidade: tituloItem,
      prazoModalidade,
      modalidadeDetalhes: {
        tipo: modalidadePreco,
        titulo: tituloItem,
        badge:
          itemVendavel.tipo === "variant"
            ? "Variante selecionada"
            : visualModalidade.badge,
        badgeBg: visualModalidade.badgeBg,
        badgeColor: visualModalidade.badgeColor,
        icone: visualModalidade.icone,
        precoBaseEmCentavos:
          itemVendavel.tipo === "variant"
            ? itemVendavel.variante.priceInCents
            : precoSelecionado!.price,
        precoBase: formatarPrecoEmReais(
          itemVendavel.tipo === "variant"
            ? itemVendavel.variante.priceInCents
            : precoSelecionado!.price,
        ),
        possuiPromocao:
          itemVendavel.tipo === "simple" && Boolean(precoSelecionado!.hasPromo),
        precoPromocionalEmCentavos:
          itemVendavel.tipo === "simple" ? precoSelecionado!.promoPrice : null,
        precoPromocional:
          itemVendavel.tipo === "simple" && precoSelecionado!.promoPrice
            ? formatarPrecoEmReais(precoSelecionado!.promoPrice)
            : null,
        tipoPromocao:
          itemVendavel.tipo === "simple" ? precoSelecionado!.promoType : null,
        promocaoTerminaEm:
          itemVendavel.tipo === "simple"
            ? precoSelecionado!.promoEndDate
            : null,
        duracaoPromocao:
          itemVendavel.tipo === "simple"
            ? precoSelecionado!.promoDuration
            : null,
        unidadeDuracaoPromocao:
          itemVendavel.tipo === "simple"
            ? precoSelecionado!.promoDurationUnit
            : null,
        precoPrincipal:
          itemVendavel.tipo === "simple" &&
          Boolean(precoSelecionado!.mainCardPrice),
        ativo:
          itemVendavel.tipo === "variant"
            ? itemVendavel.variante.isActive
            : Boolean(precoSelecionado!.isActive),
        garantia: "12 meses",
        origemEnvio: "Brasil",
      },
      frete,
      pix: precos.pix,
      cartao: precos.cartao,
    };
  });

  const freteEmCentavos = calcularFreteItensCheckout({ itens });
  const itensPix = itensCalculados.map((item) => ({
    precoEmCentavos: item.pix.valorEmCentavos,
    quantidade: item.quantidade,
  }));
  const itensCartao = itensCalculados.map((item) => ({
    precoEmCentavos: item.cartao.valorEmCentavos,
    quantidade: item.quantidade,
  }));
  const totaisPix = calcularTotalCheckout({
    itens: itensPix,
    freteEmCentavos,
    cupom,
  });
  const totaisCartao = calcularTotalCheckout({
    itens: itensCartao,
    freteEmCentavos,
    cupom,
  });
  const parcelamentosCartao = calcularParcelamentosCartao({
    valorEmCentavos: totaisCartao.totalEmCentavos,
    configuracao: configuracaoPagamento,
  });

  // Avaliação de pagamento na entrega. Roda DEPOIS dos totais porque a faixa de valor e o
  // teto de dinheiro dependem do total já calculado.
  //
  // A base é o total do PIX: pagar na entrega não tem acréscimo de gateway, então cobrar o
  // valor do cartão seria cobrar juros de uma maquininha que a loja não usa.
  //
  // O frete vem do carrinho, que é editável pelo usuário — por isso este resultado é só
  // exibição e carrega `exigeRevalidacao`. A decisão vinculante é refeita na criação do
  // pedido, a partir do snapshot produzido pelo servidor.
  const avaliacaoNaEntrega = await avaliarPagamentoNaEntregaComBanco({
    // "carrinho" e não "checkout", ainda que isto rode na página de checkout: o contexto
    // descreve a QUALIDADE DA FONTE, não a tela. O frete aqui vem do carrinho, que mora no
    // localStorage e o usuário consegue editar. Declarar "checkout" faria o motor tratar a
    // decisão como final e devolver `exigeRevalidacao: false` — exatamente a garantia que
    // não temos. Quem passa "checkout" é a criação do pedido, com o snapshot do servidor.
    contexto: "carrinho",
    itens: itens.map((item) => ({
      itemCarrinhoId: item.id,
      produtoId: item.produtoId,
      varianteId: item.produtoVarianteId ?? null,
      modalidadeInformada: item.modalidadeTipo ?? null,
      frete:
        item.freteEscolhido === undefined
          ? null
          : {
              provedor: item.freteEscolhido.id,
              servico: item.freteEscolhido.servico ?? "",
              cepCotado: item.freteEscolhido.cep ?? null,
            },
    })),
    totalPedidoEmCentavos: totaisPix.totalEmCentavos,
    cepEntrega,
  });

  return {
    itens: itensCalculados,
    pagamentos: {
      pix: {
        ativo: configuracaoPagamento.pixAtivo,
        totalEmCentavos: totaisPix.totalEmCentavos,
        total: formatarPrecoEmReais(totaisPix.totalEmCentavos),
        economiaEmCentavos: Math.max(
          totaisCartao.totalEmCentavos - totaisPix.totalEmCentavos,
          0,
        ),
      },
      cartao: {
        ativo: configuracaoPagamento.cartaoAtivo,
        totalEmCentavos: totaisCartao.totalEmCentavos,
        total: formatarPrecoEmReais(totaisCartao.totalEmCentavos),
        parcelamentos: parcelamentosCartao,
      },
      naEntrega: {
        ativo: avaliacaoNaEntrega.elegivel,
        totalEmCentavos: totaisPix.totalEmCentavos,
        total: formatarPrecoEmReais(totaisPix.totalEmCentavos),
        formasPermitidas: avaliacaoNaEntrega.formasPermitidas,
        motivos: avaliacaoNaEntrega.motivos,
        observacoesCliente:
          avaliacaoNaEntrega.regrasAplicadas?.observacoesCliente ?? null,
        exigeTroco: avaliacaoNaEntrega.limites.exigeTroco,
        exigeRevalidacao: avaliacaoNaEntrega.exigeRevalidacao,
      },
    },
    totaisPorFormaPagamento: {
      pix: totaisPix,
      cartao: totaisCartao,
      // Mesma base do PIX, pelo mesmo motivo: sem acréscimo de gateway.
      naEntrega: totaisPix,
    },
  };
}
