"use server";

import { inArray } from "drizzle-orm";
import Stripe from "stripe";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";

import { calcularFreteCheckout } from "../lib/calcular-frete-checkout";
import { calcularTotalCheckout } from "../lib/calcular-total-checkout";
import { montarItensStripe } from "../lib/montar-itens-stripe";
import { checkoutVisitanteSchema } from "../schemas/checkout.schema";

export async function criarSessaoCheckoutStripe(data: unknown) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key is not set");
  }

  const dados = checkoutVisitanteSchema.parse(data);
  const produtosIds = [...new Set(dados.itens.map((item) => item.produtoId))];

  const produtos = await db.query.productTable.findMany({
    where: inArray(productTable.id, produtosIds),
    with: {
      pricing: true,
    },
  });

  const itensValidados = dados.itens.map((item) => {
    const produto = produtos.find(
      (produtoAtual) => produtoAtual.id === item.produtoId,
    );

    if (!produto) {
      throw new Error(`Produto não encontrado: ${item.nome}`);
    }

    const precoSelecionado =
      produto.pricing.find(
        (preco) =>
          preco.pricingModalDescription === item.variante ||
          preco.type === item.variante,
      ) ||
      produto.pricing.find((preco) => preco.mainCardPrice) ||
      produto.pricing.find((preco) => preco.isActive) ||
      produto.pricing[0];

    if (!precoSelecionado) {
      throw new Error(`Produto sem preço ativo: ${produto.name}`);
    }

    const precoEmCentavos =
      precoSelecionado.hasPromo && precoSelecionado.promoPrice
        ? precoSelecionado.promoPrice
        : precoSelecionado.price;

    return {
      ...item,
      nome: produto.name,
      variante:
        precoSelecionado.pricingModalDescription || precoSelecionado.type,
      prazoModalidade: precoSelecionado.deliveryDays || "Consulte prazo",
      precoEmCentavos,
    };
  });

  const frete = calcularFreteCheckout(dados.freteId);
  const totais = calcularTotalCheckout({
    itens: itensValidados,
    freteEmCentavos: frete.valorEmCentavos,
    cupom: dados.cupom,
  });

  if (totais.totalEmCentavos <= 0) {
    throw new Error("Total do checkout inválido");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: dados.formaPagamento === "pix" ? ["pix"] : ["card"],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
    customer_email: dados.email,
    line_items: montarItensStripe({
      totalEmCentavos: totais.totalEmCentavos,
      quantidadeItens: itensValidados.reduce(
        (total, item) => total + item.quantidade,
        0,
      ),
    }),
    metadata: {
      tipo: "checkout_visitante",
      email: dados.email,
      telefone: dados.telefone,
      frete: frete.id,
      cupom: dados.cupom?.trim().toUpperCase() || "",
      formaPagamento: dados.formaPagamento,
      parcelasCartao: String(dados.parcelasCartao || 1),
      observacao: dados.observacao || "",
    },
  });

  if (!checkoutSession.url) {
    throw new Error("Não foi possível criar a sessão de pagamento");
  }

  return {
    url: checkoutSession.url,
  };
}
