import { PedidosAdminPage } from "@/features/checkout/components/admin/pedidos/pedidos-admin-page";

type AdminOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  return <PedidosAdminPage searchParams={await searchParams} />;
}
