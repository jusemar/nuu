import { EstadosEntregaPropriaPage } from "@/features/admin/logistics/entrega-propria/components/admin/estados-entrega-propria-page";
import { listarEstadosEntregaPropria } from "@/features/admin/logistics/entrega-propria/queries/admin-entrega-propria.queries";

export default async function Page() {
  const estados = await listarEstadosEntregaPropria();

  return <EstadosEntregaPropriaPage estados={estados} />;
}
