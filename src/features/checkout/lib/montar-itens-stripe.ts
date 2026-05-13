import type Stripe from "stripe";

type MontarItensStripeParams = {
  totalEmCentavos: number;
  quantidadeItens: number;
};

export function montarItensStripe({
  totalEmCentavos,
  quantidadeItens,
}: MontarItensStripeParams): Stripe.Checkout.SessionCreateParams.LineItem[] {
  return [
    {
      price_data: {
        currency: "brl",
        product_data: {
          name: "Pedido Do Rocha",
          description: `${quantidadeItens} item(ns), frete e descontos aplicados`,
        },
        unit_amount: totalEmCentavos,
      },
      quantity: 1,
    },
  ];
}
