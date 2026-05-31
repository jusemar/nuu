import { PaginaBannersHomeAdmin } from "@/features/banners-home/components/admin/pagina-banners-home-admin";
import { listarBannersHomeAdmin } from "@/features/banners-home/queries/listar-banners-home-admin";

export default async function BannersHomeAdminPage() {
  const banners = await listarBannersHomeAdmin();

  return <PaginaBannersHomeAdmin banners={banners} />;
}
