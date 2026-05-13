import { CheckoutVisitante } from "@/features/checkout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Confira seus dados, frete, cupom e total do pedido antes do pagamento.",
};

export default function CheckoutPage() {
  return <CheckoutVisitante />;
}
