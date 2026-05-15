import type { Metadata } from "next";

import { CheckoutSucesso } from "@/features/checkout";

export const metadata: Metadata = {
  title: "Pedido recebido",
  description: "Pedido recebido com sucesso.",
};

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    pedido?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { pedido } = await searchParams;

  return <CheckoutSucesso numeroPedido={pedido} />;
}
