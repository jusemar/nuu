import type { Metadata } from "next";

import { CheckoutSucesso } from "@/features/checkout";

export const metadata: Metadata = {
  title: "Pedido recebido",
  description: "Pagamento confirmado e pedido recebido com sucesso.",
};

export default function CheckoutSuccessPage() {
  return <CheckoutSucesso />;
}
