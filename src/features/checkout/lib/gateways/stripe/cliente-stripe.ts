import Stripe from "stripe";

export function obterStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY não configurada.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2023-10-16",
  });
}

export function obterWebhookSecretStripe() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET não configurada.");
  }

  return webhookSecret;
}
