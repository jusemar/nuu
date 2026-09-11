import { PoliticasEntregaPropriaPage } from "@/features/admin/logistics/entrega-propria/components/admin/politicas-entrega-propria-page";
import { listarPoliticasEntregaPropriaAdmin } from "@/features/admin/logistics/entrega-propria/queries/politicas-entrega-propria.queries";

export default async function Page() {
  const dados = await listarPoliticasEntregaPropriaAdmin();
  return <PoliticasEntregaPropriaPage {...dados} />;
}
