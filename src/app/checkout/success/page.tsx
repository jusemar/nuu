import type { Metadata } from "next";

import {
  buscarStatusPagamentoPedidoSucesso,
  CheckoutSucesso,
  sincronizarPagamentoCheckoutStripe,
} from "@/features/checkout";

export const metadata: Metadata = {
  title: "Pedido recebido",
  description: "Pedido recebido com sucesso.",
};

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    pedido?: string;
    session_id?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { pedido, session_id: sessionId } = await searchParams;

  if (sessionId) {
    await sincronizarPagamentoCheckoutStripe({
      sessionId,
      numeroPedido: pedido,
    });
  }

  const pagamentoStatus = await buscarStatusPagamentoPedidoSucesso(pedido);

  return (
    <CheckoutSucesso numeroPedido={pedido} pagamentoStatus={pagamentoStatus} />
  );
}
