import { PedidoDetalheAdminPage } from "@/features/checkout/components/admin/pedidos/pedido-detalhe-admin-page";

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;

  return <PedidoDetalheAdminPage id={id} />;
}
