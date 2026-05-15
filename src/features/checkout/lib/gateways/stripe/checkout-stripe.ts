import { obterStripe } from "./cliente-stripe";
import type {
  CheckoutCartaoStripe,
  CriarCheckoutCartaoStripeInput,
} from "../../../types/stripe-checkout.types";

function obterBaseUrlAplicacao() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;

  if (!baseUrl) {
    throw new Error("URL pública da aplicação não configurada.");
  }

  return baseUrl.replace(/\/$/, "");
}

export async function criarCheckoutCartaoStripe({
  pedidoId,
  pagamentoId,
  numeroPedido,
  email,
  totalEmCentavos,
  quantidadeItens,
}: CriarCheckoutCartaoStripeInput): Promise<CheckoutCartaoStripe> {
  const stripe = obterStripe();
  const baseUrl = obterBaseUrlAplicacao();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,
    success_url: `${baseUrl}/checkout/success?pedido=${encodeURIComponent(numeroPedido)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout?pedido_cancelado=${encodeURIComponent(numeroPedido)}`,
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: `Pedido ${numeroPedido}`,
            description: `${quantidadeItens} item(ns), frete e descontos aplicados`,
          },
          unit_amount: totalEmCentavos,
        },
        quantity: 1,
      },
    ],
    metadata: {
      tipo: "checkout_visitante",
      pedidoId,
      pagamentoId,
      numeroPedido,
    },
    payment_intent_data: {
      metadata: {
        tipo: "checkout_visitante",
        pedidoId,
        pagamentoId,
        numeroPedido,
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe não retornou a URL do checkout.");
  }

  return {
    sessionId: session.id,
    url: session.url,
    providerResponse: session,
  };
}
