"use server";

import { inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";
import type { ItemCarrinho } from "@/features/carrinho";
import {
  buscarConfiguracaoPagamentoAtiva,
  calcularParcelamentosCartao,
  calcularPrecoProduto,
  formatarPrecoEmReais,
} from "@/features/precificacao";

import { calcularTotalCheckout } from "../../lib/calcular-total-checkout";
import {
  calcularFreteItensCheckout,
  resolverFreteItemCheckout,
} from "../../lib/resumo-checkout/calcular-frete-itens-checkout";
import { selecionarPrecoProdutoCheckout } from "../../lib/pedidos/normalizar-checkout-visitante";
import type {
  OpcaoFreteCheckoutId,
  ResumoCheckoutCalculado,
} from "../../types/checkout.types";

type CalcularResumoCheckoutParams = {
  itens: ItemCarrinho[];
  cupom?: string;
  freteFallbackId?: OpcaoFreteCheckoutId;
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

export async function calcularResumoCheckout({
  itens,
  cupom,
  freteFallbackId = "padrao",
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
    },
  });

  const itensCalculados = itens.map((item) => {
    const produto = produtos.find(
      (produtoAtual) => produtoAtual.id === item.produtoId,
    );

    if (!produto) {
      throw new Error(`Produto não encontrado: ${item.nome}`);
    }

    const precoSelecionado = selecionarPrecoProdutoCheckout(
      produto,
      item.variante,
    );
    const precoBaseEmCentavos =
      precoSelecionado.hasPromo && precoSelecionado.promoPrice
        ? precoSelecionado.promoPrice
        : precoSelecionado.price;
    const precos = calcularPrecoProduto({
      entrada: {
        produtoId: produto.id,
        modalidade: precoSelecionado.type,
        precoBaseEmCentavos,
      },
      configuracao: configuracaoPagamento,
    });
    const frete = resolverFreteItemCheckout({ item, freteFallbackId });
    const visualModalidade =
      configuracaoVisualModalidade[precoSelecionado.type] ??
      configuracaoVisualModalidade.stock;

    return {
      id: item.id,
      produtoId: produto.id,
      nome: produto.name,
      imagemUrl: item.imagemUrl,
      quantidade: item.quantidade,
      modalidade:
        precoSelecionado.pricingModalDescription || precoSelecionado.type,
      prazoModalidade: precoSelecionado.deliveryDays || "Consulte prazo",
      modalidadeDetalhes: {
        tipo: precoSelecionado.type,
        titulo:
          precoSelecionado.pricingModalDescription || precoSelecionado.type,
        badge: visualModalidade.badge,
        badgeBg: visualModalidade.badgeBg,
        badgeColor: visualModalidade.badgeColor,
        icone: visualModalidade.icone,
        precoBaseEmCentavos: precoSelecionado.price,
        precoBase: formatarPrecoEmReais(precoSelecionado.price),
        possuiPromocao: Boolean(precoSelecionado.hasPromo),
        precoPromocionalEmCentavos: precoSelecionado.promoPrice,
        precoPromocional: precoSelecionado.promoPrice
          ? formatarPrecoEmReais(precoSelecionado.promoPrice)
          : null,
        tipoPromocao: precoSelecionado.promoType,
        promocaoTerminaEm: precoSelecionado.promoEndDate,
        duracaoPromocao: precoSelecionado.promoDuration,
        unidadeDuracaoPromocao: precoSelecionado.promoDurationUnit,
        precoPrincipal: Boolean(precoSelecionado.mainCardPrice),
        ativo: Boolean(precoSelecionado.isActive),
        garantia: "12 meses",
        origemEnvio: "Brasil",
      },
      frete,
      pix: precos.pix,
      cartao: precos.cartao,
    };
  });

  const freteEmCentavos = calcularFreteItensCheckout({
    itens,
    freteFallbackId,
  });
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
    },
    totaisPorFormaPagamento: {
      pix: totaisPix,
      cartao: totaisCartao,
    },
  };
}
